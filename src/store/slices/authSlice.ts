import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/user.types";
import type { LoginCredentials } from "../../services/authService";
import { tokenStorage } from "../../services/api";
import { getErrorMessage } from "../../utils/errorHandling";

// Extract permissions from the user's role object
const extractPermissions = (user: User | null): string[] => {
  if (!user) return [];

  // The backend populates employment.roleId as the full Role object
  // mapUser normalizes it to employment.role, but check both for safety
  const role = user.employment?.role;
  const roleId = (user.employment as Record<string, unknown>)?.roleId;

  // Try role first (set by mapUser from roleId)
  if (role && typeof role === 'object') {
    const roleObj = (role as unknown) as Record<string, unknown>;
    if (Array.isArray(roleObj.permissions) && roleObj.permissions.length > 0) {
      // console.log('[RBAC] Permissions loaded from role:', roleObj.permissions);
      return roleObj.permissions as string[];
    }
  }

  // Fallback: try roleId directly (in case mapUser didn't normalize)
  if (roleId && typeof roleId === 'object') {
    const roleIdObj = (roleId as unknown) as Record<string, unknown>;
    if (Array.isArray(roleIdObj.permissions) && roleIdObj.permissions.length > 0) {
      // console.log('[RBAC] Permissions loaded from roleId:', roleIdObj.permissions);
      return roleIdObj.permissions as string[];
    }
  }

  // Last fallback: legacy permissions.modules array
  if (user.permissions?.modules && user.permissions.modules.length > 0) {
    // console.log('[RBAC] Permissions loaded from legacy modules:', user.permissions.modules);
    return user.permissions.modules;
  }

  console.warn('[RBAC] No permissions found for user. Role:', role, 'RoleId:', roleId);
  return [];
};

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: !!tokenStorage.getAccessToken(),
  user: null,
  permissions: [],
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const { authService } = await import("../../services/authService");
      const response = await authService.login(credentials);
      if (!response.success) {
        return rejectWithValue("Login failed");
      }
      
      return response.data;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Invalid email or password");
      const message = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage;
      return rejectWithValue(message);
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (checked: boolean = true, { rejectWithValue }) => {
    try {
      const { authService } = await import("../../services/authService");
      const response = await authService.loginWithGoogle(checked);
      if (!response.success) {
        return rejectWithValue("Google login failed");
      }
      return response.data;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Google login failed");
      // If errorMessage is an array, join them; otherwise use as is
      const message = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage;
      return rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  const { authService } = await import("../../services/authService");
  await authService.logout();
});

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { authService } = await import("../../services/authService");
      const response = await authService.getCurrentUser();
      return response.data.user;
    } catch {
      tokenStorage.clearTokens();
      return rejectWithValue("Failed to fetch user");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.permissions = extractPermissions(action.payload.user);
      state.error = null;
      tokenStorage.setTokens(
        action.payload.accessToken,
        action.payload.refreshToken,
      );
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.permissions = [];
      state.error = null;
      tokenStorage.clearTokens();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.permissions = extractPermissions(action.payload.user);
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      // Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.permissions = extractPermissions(action.payload.user);
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.permissions = [];
        state.error = null;
        tokenStorage.clearTokens();
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout API fails, clear local state
        state.isAuthenticated = false;
        state.user = null;
        state.permissions = [];
        state.error = null;
        tokenStorage.clearTokens();
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.permissions = extractPermissions(action.payload);
        state.isInitialized = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.permissions = [];
        state.isInitialized = true;
        state.error = null;
        tokenStorage.clearTokens();
      });
  },
});

export const { loginSuccess, logoutSuccess, clearError } = authSlice.actions;
export default authSlice.reducer;
