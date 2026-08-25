import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiCache, TTL_CONFIG } from "../utils/apiCache";
import { setSessionReplacedOpen } from "../store/slices/uiSlice";

import { getApiBaseUrl } from "../utils/env";

const API_BASE_URL = getApiBaseUrl();

console.log('[API] Environment Base URL:', import.meta.env.BASE_URL);
console.log('[API] API Base URL:', API_BASE_URL);

// Token storage keys
const ACCESS_TOKEN_KEY = "hrm_admin_accessToken";
const REFRESH_TOKEN_KEY = "hrm_admin_refreshToken";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};


// Flag to prevent multiple logout attempts
let isLoggingOut = false;

const forceLogout = async (
  reason?: "session_invalidated",
  message?: string,
) => {
  console.warn('[API] Forcing logout. Reason:', reason, 'Message:', message);
  if (isLoggingOut) return;
  isLoggingOut = true;
  // 1. Clear tokens IMMEDIATELY (don't wait for async operations)
  tokenStorage.clearTokens();

  // 2. Set session messages
  if (reason) {
    sessionStorage.setItem("logoutReason", reason);
    if (message) {
      sessionStorage.setItem("logoutMessage", message);
    }
  }

  const redirectUrl = `/${import.meta.env.BASE_URL}/login`.replace(/\/+/g, "/");
  console.log('[API] Forcing logout. Redirecting to:', redirectUrl);
  window.location.href = redirectUrl;

  // 4. Unregister notification token in background (non-blocking)
  try {
    const { notificationService } = await import("./notificationService");
    await notificationService.unregisterToken();
    console.info("Notification token unregistered successfully on logout.");
  } catch (err) {
    console.warn("Notification unregister failed:", err);
  }
};



/**
 * Determine TTL based on endpoint
 */
const getTTLForEndpoint = (url: string): number => {
  if (url.includes('/auth/me')) return TTL_CONFIG.AUTH_ME;
  if (url.includes('/locations')) return TTL_CONFIG.LOCATIONS;
  if (url.includes('/departments')) return TTL_CONFIG.DEPARTMENTS;
  if (url.includes('/designations')) return TTL_CONFIG.DESIGNATIONS;
  if (url.includes('/clients')) return TTL_CONFIG.CLIENTS;
  if (url.includes('/holidays')) return TTL_CONFIG.HOLIDAYS;
  if (url.includes('/users') && url.match(/\/users\/[^/]+$/)) return TTL_CONFIG.USER_PROFILE;
  if (url.includes('/users')) return TTL_CONFIG.USERS;
  if (url.includes('/schedules')) return TTL_CONFIG.SCHEDULES;
  if (url.includes('/attendance')) return TTL_CONFIG.ATTENDANCE;
  if (url.includes('/leave-requests') || url.includes('/leave-types')) return TTL_CONFIG.LEAVE;
  if (url.includes('/reimbursements')) return TTL_CONFIG.REIMBURSEMENTS;
  if (url.includes('/announcements')) return TTL_CONFIG.DEPARTMENTS; // Use DEPARTMENTS TTL as a reasonable default
  if (url.includes('/roles')) return TTL_CONFIG.DEPARTMENTS;
  return TTL_CONFIG.NO_CACHE;
};

/**
 * Check if request should use cache (only GET requests)
 */
const shouldUseCache = (config: InternalAxiosRequestConfig): boolean => {
  return config.method?.toUpperCase() === 'GET' && getTTLForEndpoint(config.url || '') > 0;
};

/**
 * Invalidate cache for related endpoints after mutations
 */
const invalidateCacheAfterMutation = (url: string, method: string) => {
  const upperMethod = method.toUpperCase();

  // Don't invalidate on GET requests
  if (upperMethod === 'GET') return;

  // Invalidate specific patterns based on the endpoint
  if (url.includes('/schedules')) {
    apiCache.removePattern('/schedules');
  } else if (url.includes('/attendance')) {
    apiCache.removePattern('/attendance');
  } else if (url.includes('/users')) {
    apiCache.removePattern('/users');
    apiCache.removePattern('/auth/me');
  } else if (url.includes('/locations')) {
    apiCache.removePattern('/locations');
  } else if (url.includes('/departments')) {
    apiCache.removePattern('/departments');
  } else if (url.includes('/designations')) {
    apiCache.removePattern('/designations');
  } else if (url.includes('/holidays')) {
    apiCache.removePattern('/holidays');
  } else if (url.includes('/clients')) {
    apiCache.removePattern('/clients');
  } else if (url.includes('/leave-requests') || url.includes('/leave-types')) {
    apiCache.removePattern('/leave-requests');
    apiCache.removePattern('/leave-types');
  } else if (url.includes('/reimbursements')) {
    apiCache.removePattern('/reimbursements');
  } else if (url.includes('/announcements')) {
    apiCache.removePattern('/announcements');
  } else if (url.includes('/roles')) {
    apiCache.removePattern('/roles');
  } else if (url.includes('/incidents')) {
    apiCache.removePattern('/incidents');
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add auth token and check cache
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token and timezone
    const token = tokenStorage.getAccessToken();
    const timezone = localStorage.getItem('admin_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Attaching token to request:', config.url, 'Token prefix:', token.substring(0, 10) + '...');
      }
      config.headers['X-Timezone'] = timezone;
    }

    // Check cache for GET requests
    if (shouldUseCache(config)) {
      const cachedData = apiCache.get(config.url || '', config.params);
      if (cachedData) {
        // Return cached data by canceling the request and resolving with cached response
        const cancelToken = axios.CancelToken.source();
        config.cancelToken = cancelToken.token;

        // Cancel the request immediately and attach cached data
        cancelToken.cancel(JSON.stringify({
          cached: true,
          data: cachedData,
        }));
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors, token refresh, and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method?.toUpperCase() === 'GET') {
      const ttl = getTTLForEndpoint(response.config.url || '');
      if (ttl > 0) {
        apiCache.set(response.config.url || '', response.data, response.config.params, ttl);
      }
    }

    // Invalidate cache after mutations
    if (response.config.url && response.config.method) {
      invalidateCacheAfterMutation(response.config.url, response.config.method);
    }

    return response;
  },
  async (error: AxiosError) => {
    // Handle cached responses (canceled requests with cached data)
    if (axios.isCancel(error)) {
      try {
        const cancelMessage = error.message;
        const parsedMessage = JSON.parse(cancelMessage || '{}');
        if (parsedMessage.cached) {
          // Return the cached data as a successful response
          return Promise.resolve({
            data: parsedMessage.data,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: error.config!,
          });
        }
      } catch {
        // If parsing fails, it's a regular cancellation
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't handle login/google auth/unregister endpoints - let them return errors normally
    if (
      !originalRequest?.url ||
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/google") ||
      originalRequest.url.includes("/notifications/unregister") ||
      originalRequest.url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Only attempt refresh if it's not already a retry
    if (error.response?.status === 401) {
      console.log('[API] 401 Unauthorized Details:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.response?.data,
        accessTokenPrefix: tokenStorage.getAccessToken()?.substring(0, 10),
        refreshTokenPrefix: tokenStorage.getRefreshToken()?.substring(0, 10)
      });
      const responseData = error.response.data as { error?: { code?: string } | string } | undefined;
      const errorCode = typeof responseData?.error === 'object' ? responseData?.error?.code : responseData?.error;

      if (errorCode === "SESSION_REPLACED") {
        const { store } = await import("../store/store");
        store.dispatch(setSessionReplacedOpen(true));
        // Stop further processing, but don't redirect yet (modal will handle it)
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        console.error('[API] 401 error on retry. Forcing logout.');
        // We already tried to refresh the token and still got a 401
        await forceLogout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        await forceLogout();
        return Promise.reject(error);
      }

      try {
        console.log('[API] Attempting to refresh token...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        console.log('[API] Token refresh successful.');
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        tokenStorage.setTokens(accessToken, newRefreshToken);

        // Update authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError: unknown) {
        const error = refreshError as AxiosError<{ error?: { code?: string; message?: string } | string }>;
        processQueue(error, null);

        const responseData = error?.response?.data;
        const errorCode = typeof responseData?.error === 'object' ? responseData?.error?.code : responseData?.error;

        if (errorCode === "SESSION_REPLACED") {
          const { store } = await import("../store/store");
          store.dispatch(setSessionReplacedOpen(true));
          return Promise.reject(refreshError);
        }
        
        const errorMessage = (typeof responseData?.error === 'object' ? responseData?.error?.message : "") || "";
        const isSessionInvalidated =
          errorMessage.includes("another device") ||
          errorMessage.includes("session has been invalidated");

        await forceLogout(
          isSessionInvalidated ? "session_invalidated" : undefined,
          errorMessage,
        );

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (400, 403, 500, etc.), reject immediately
    return Promise.reject(error);
  },
);

export default api;
