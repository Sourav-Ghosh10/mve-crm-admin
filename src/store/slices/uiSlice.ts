import { createSlice } from "@reduxjs/toolkit";

interface UIState {
  sidebarOpen: boolean;
  timezoneView: 'employee' | 'admin';
  selectedTimezone: string;
  sessionReplacedOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  timezoneView: 'admin',
  selectedTimezone: localStorage.getItem('admin_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  sessionReplacedOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTimezoneView: (state, action) => {
      state.timezoneView = action.payload;
    },
    setSelectedTimezone: (state, action) => {
      state.selectedTimezone = action.payload;
      localStorage.setItem('admin_timezone', action.payload);
    },
    setSessionReplacedOpen: (state, action) => {
      state.sessionReplacedOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setTimezoneView, setSelectedTimezone, setSessionReplacedOpen } = uiSlice.actions;
export default uiSlice.reducer;
