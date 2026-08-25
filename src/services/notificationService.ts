import api from "./api";
import axios from "axios";

export const notificationService = {
  /**
   * Unregister the device notification token from the server.
   * Called on logout or when refresh token becomes invalid.
   * Silently fails on 401 (token already invalid) or other errors.
   */
  unregisterToken: async (): Promise<void> => {
    try {
      await api.post("/notifications/unregister");
    } catch (err) {
      // If it's a 401 (unauthorized), the token is already invalid - skip silently
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        console.debug("Notification token already invalidated (401), skipping unregister");
        return;
      }
      // Log other errors but don't throw - unregister failures shouldn't block logout
      console.error("Failed to unregister notification token:", err);
    }
  },

  /**
   * Register a device notification token with the server.
   * Called after successful login or when app regains auth.
   */
  registerToken: async (token: string): Promise<void> => {
    try {
      await api.post("/notifications/register", { token });
    } catch (err) {
      console.error("Failed to register notification token:", err);
    }
  },

  /**
   * Fetch recent notifications for the current user.
   */
  getNotifications: async () => {
    return api.get("/notifications?limit=20");
  },

  /**
   * Mark a specific notification as read.
   */
  markAsRead: async (id: string) => {
    return api.put(`/notifications/${id}/mark-read`);
  },

  /**
   * Mark all notifications as read.
   */
  markAllRead: async () => {
    return api.put("/notifications/mark-all-read");
  },
};
