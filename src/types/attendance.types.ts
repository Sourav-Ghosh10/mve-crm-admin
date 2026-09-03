export interface AttendanceCheck {
  time: string;
  ipAddress: string;
  deviceInfo?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface AttendanceSession {
  _id: string;
  checkIn: AttendanceCheck;
  checkOut?: AttendanceCheck;
  duration: number;
  durationString?: string;
  breakDurationString?: string;
  isLate: boolean;
  isEarlyLeave: boolean;
}

export interface AttendanceBreak {
  _id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  durationString?: string;
}

export interface EmployeeInfo {
  _id: string;
  username: string;
  employeeId?: string;
  fullName?: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email: string;
    profilePicture?: string;
  };
  employment?: {
    timezone?: string;
    department?: string;
    designation?: string;
    role?: string;
  };
  isHolidayApplicable?: boolean;
}

export interface Attendance {
  _id: string;
  employeeId: EmployeeInfo;
  date: string;
  checkIn: AttendanceCheck;
  checkOut?: AttendanceCheck;
  sessions: AttendanceSession[];
  breaks: AttendanceBreak[];
  status: string;
  totalHours: number;
  totalDurationString?: string;
  netDurationString?: string;
  breakTime?: number;
  totalBreakDurationString?: string;
  overtime: number;
  remarks: string;
  punctuality: string;
  isLate: boolean;
  isEarlyLeave: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  email?: string;
  profilePicture?: string;
  department?: string;
  designation?: string;
  timeline?: any[];
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  userId?: string;
  employeeId?: string;
  search?: string;
  department?: string;
  designation?: string;
}
