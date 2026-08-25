export interface ApiErrorResponse {
  message?: string;
  error?: string | {
    message?: string;
    code?: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
    timestamp?: string;
  };
  success?: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
