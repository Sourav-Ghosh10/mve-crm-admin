export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee" | "hr";
  avatar?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export * from './settings.types';

