import api, { tokenStorage } from "./api";
import { notificationService } from "./notificationService";
import type { User } from "../types/user.types";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

export interface LoginCredentials {
  email: string;
  password: string;
  checked: boolean;
  // favourite: boolean;
  // admin: boolean;
}

// Raw response interfaces matching the API
interface RawUser {
  id?: string;
  _id?: string;
  employeeId: string;
  isAdmin: boolean;
  username: string;
  userType?: 'INTERNAL' | 'CLIENT';
  clientId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  };
  employment: {
    role?: string | {
      _id: string;
      name: string;
      description?: string;
      permissions?: string[];
      isActive: boolean;
      id?: string;
    };
    roleId?: {
      _id: string;
      name: string;
      description?: string;
      permissions?: string[];
      isActive: boolean;
      id?: string;
    };
    department: string;
    designation: string;
    dateOfJoining: string;
    employmentType: string;
    reportingManager?: string | {
      _id: string;
      personalInfo: {
        firstName: string;
        lastName: string;
        profilePicture?: string;
      };
    };
    location?: string;
    workingHours?: {
      startTime: string;
      endTime: string;
      weeklyOff: string[];
    };
  };
  permissions: {
    modules: string[];
    canApproveLeave: boolean;
    canApproveReimbursement: boolean;
    canManageSchedule: boolean;
    canViewReports: boolean;
  };
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
    compOff: number;
  };
  isActive: boolean;
  isHolidayApplicable?: boolean;
  lastLogin?: string;
}

interface RawAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: RawUser;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  };
}

interface RawUserResponse {
  success: boolean;
  data: RawUser;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Helper to map RawUser to User
const mapUser = (raw: RawUser): User => {
  const idValue = raw.id || raw._id || "";
  return {
    id: idValue,
    _id: idValue,
    isAdmin: raw.isAdmin,
    employeeId: raw.employeeId,
    username: raw.username,
    userType: raw.userType,
    clientId: raw.clientId,
    personalInfo: {
      ...raw.personalInfo,
    },
    employment: {
      ...raw.employment,
      role: (typeof raw.employment.roleId === 'object' ? raw.employment.roleId : (raw.employment.role || "employee")) as User["employment"]["role"],
      roleId: typeof raw.employment.roleId === 'object' ? raw.employment.roleId?._id : (raw.employment.roleId || (typeof raw.employment.role === 'string' ? raw.employment.role : undefined)),
      employmentType: (raw.employment.employmentType || "full-time") as User["employment"]["employmentType"],
    },
    permissions: {
      ...raw.permissions,
    },
    leaveBalance: {
      ...raw.leaveBalance,
    },
    isActive: raw.isActive,
    isHolidayApplicable: raw.isHolidayApplicable ?? true,
    lastLogin: raw.lastLogin,
    allowedIPs: [],
    failedLoginAttempts: 0
  };
};


export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<RawAuthResponse>("/auth/login", credentials);

    if (response.data.success) {
      tokenStorage.setTokens(
        response.data.data.accessToken,
        response.data.data.refreshToken,
      );
      return {
        success: true,
        data: {
          user: mapUser(response.data.data.user),
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        }
      };
    }

    throw new Error(response.data.message || "Login failed");
  },

  loginWithGoogle: async (checked: boolean = true): Promise<AuthResponse> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const email = user.email;

      if (!email) {
        throw new Error("Could not retrieve email from Google account");
      }

      const response = await api.post<RawAuthResponse>("/auth/google", {
        idToken,
        email,
        checked,
      });

      if (response.data.success) {
        tokenStorage.setTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken,
        );

        return {
          success: true,
          data: {
            user: mapUser(response.data.data.user),
            accessToken: response.data.data.accessToken,
            refreshToken: response.data.data.refreshToken,
          },
        };
      }

      throw new Error(response.data.message || "Google login failed");
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      // Unregister notification token first
      await notificationService.unregisterToken();
    } catch (err) {
      // Don't block logout if unregister fails
      console.error("Error unregistering notification token:", err);
    }

    try {
      await api.post("/auth/logout");
    } finally {
      // Always clear tokens, even if API call fails
      tokenStorage.clearTokens();
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email });
  },

  verifyOtp: async (email: string, otp: string): Promise<string> => {
    interface VerifyOtpResponse {
      success: boolean;
      message?: string;
      data?: {
        token?: string;
      };
      token?: string;
    }

    const response = await api.post<VerifyOtpResponse>(
      "/auth/verify-otp",
      { email, otp },
    );

    // Some backends return the token in different structures or not at all
    // Fallback order: response.data.data.token -> response.data.token -> otp
    if (response.data?.success) {
      return response.data.data?.token || response.data.token || otp;
    }

    throw new Error(response.data?.message || "OTP verification failed");
  },

  resetPassword: async (password: string, token: string): Promise<void> => {
    await api.post("/auth/reset-password", { password, token });
  },
  resetPasswordByOtp: async (email: string, otp: string, password: string): Promise<void> => {
    await api.post("/auth/reset-password", {
      email,
      otp,
      newPassword: password
    });
  },

  getCurrentUser: async (): Promise<{
    success: boolean;
    data: { user: User };
  }> => {
    const response = await api.get<RawUserResponse>("/auth/me");
    return {
      success: true,
      data: {
        user: mapUser(response.data.data)
      }
    };
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};
