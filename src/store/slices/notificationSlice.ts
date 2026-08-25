import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { NotificationState, Notification } from "../../types/notification.types";

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  message: null,
  type: "info",
};

export const fetchNotifications = createAsyncThunk(
  "notification/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { notificationService } = await import("../../services/notificationService");
      const response = await notificationService.getNotifications();
      return response.data;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch notifications";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notification/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const { notificationService } = await import("../../services/notificationService");
      await notificationService.markAsRead(id);
      return id;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to mark as read";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notification/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const { notificationService } = await import("../../services/notificationService");
      await notificationService.markAllRead();
      return true;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to mark all as read";
      return rejectWithValue(errorMessage);
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification: (state, action) => {
      state.message = action.payload.message;
      state.type = action.payload.type || "info";
    },
    clearNotification: (state) => {
      state.message = null;
    },
    addRealtimeNotification: (state, action: { payload: Notification }) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data.notifications || [];
        state.unreadCount = action.payload.data.unreadCount ?? action.payload.data.pagination?.total ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notif = state.notifications.find(n => n._id === action.payload);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { showNotification, clearNotification, addRealtimeNotification } =
  notificationSlice.actions;
export default notificationSlice.reducer;
