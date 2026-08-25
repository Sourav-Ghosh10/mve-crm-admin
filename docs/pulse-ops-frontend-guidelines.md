# Pulse Ops - Frontend Development Guidelines

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Component Guidelines](#component-guidelines)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Styling Guidelines](#styling-guidelines)
8. [Form Handling](#form-handling)
9. [Error Handling](#error-handling)
10. [Performance](#performance)
11. [Security](#security)
12. [Git Workflow](#git-workflow)
13. [Code Review Checklist](#code-review-checklist)

---

## Technology Stack

### Core Technologies

| Technology      | Version | Purpose                |
| --------------- | ------- | ---------------------- |
| React           | 18.2+   | UI Framework           |
| TypeScript      | 5.0+    | Type Safety            |
| Vite            | 4.5+    | Build Tool             |
| Redux Toolkit   | 1.9+    | Global State           |
| React Query     | 5.0+    | Server State & Caching |
| React Router    | 6.16+   | Routing                |
| Material-UI     | 5.14+   | UI Components          |
| React Hook Form | 7.47+   | Forms                  |
| Yup             | 1.3+    | Validation             |
| Axios           | 1.5+    | HTTP Client            |
| date-fns        | 2.30+   | Date Utilities         |

---

## Project Structure

```
src/
├── assets/                 # Static assets (images, fonts)
│   ├── images/
│   └── fonts/
├── components/             # Reusable components
│   ├── common/             # Generic UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Card/
│   │   ├── LoadingSpinner/
│   │   └── EmptyState/
│   ├── layout/             # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── features/           # Feature-specific components
│       ├── users/
│       ├── attendance/
│       ├── schedule/
│       ├── leave/
│       └── reimbursement/
├── pages/                  # Page components (routes)
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── index.ts
│   ├── Users/
│   │   ├── UserList.tsx
│   │   ├── UserForm.tsx
│   │   └── UserProfile.tsx
│   ├── Attendance/
│   ├── Schedule/
│   ├── Leave/
│   └── Login/
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── usePagination.ts
├── services/               # API services
│   ├── api.ts              # Axios instance
│   ├── authService.ts
│   ├── userService.ts
│   ├── attendanceService.ts
│   └── leaveService.ts
├── store/                  # Redux store
│   ├── store.ts
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── uiSlice.ts
│   │   └── notificationSlice.ts
│   └── hooks.ts            # Typed hooks
├── types/                  # TypeScript types
│   ├── index.ts
│   ├── user.types.ts
│   ├── attendance.types.ts
│   └── api.types.ts
├── utils/                  # Utility functions
│   ├── constants.ts
│   ├── helpers.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── storage.ts
├── styles/                 # Global styles
│   ├── theme.ts
│   └── global.css
├── App.tsx
├── main.tsx
└── routes.tsx
```

### File Naming Conventions

| Type       | Convention                      | Example            |
| ---------- | ------------------------------- | ------------------ |
| Components | PascalCase                      | `UserCard.tsx`     |
| Pages      | PascalCase                      | `Dashboard.tsx`    |
| Hooks      | camelCase with `use` prefix     | `useAuth.ts`       |
| Services   | camelCase with `Service` suffix | `userService.ts`   |
| Utilities  | camelCase                       | `helpers.ts`       |
| Types      | camelCase with `.types` suffix  | `user.types.ts`    |
| Test files | Same name with `.test` suffix   | `Button.test.tsx`  |
| Styles     | Same name with `.styles` suffix | `Button.styles.ts` |

---

## Coding Standards

### TypeScript Rules

```typescript
// GOOD: Use explicit types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "employee" | "manager";
  isActive: boolean;
}

// GOOD: Use type for function parameters and return types
const getUserFullName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`;
};

// BAD: Avoid 'any' type
const processData = (data: any) => {}; // DON'T DO THIS

// GOOD: Use 'unknown' and narrow the type
const processData = (data: unknown) => {
  if (typeof data === "string") {
    // Now TypeScript knows data is a string
  }
};
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = "John";
const getUserById = (id: string) => {};

// Components and Types: PascalCase
interface UserProfile {}
const UserCard: React.FC<UserCardProps> = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.pulseops.com";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Boolean variables: prefix with is, has, should, can
const isLoading = false;
const hasPermission = true;
const shouldShowModal = false;
const canEdit = true;

// Event handlers: prefix with handle or on
const handleClick = () => {};
const onSubmit = () => {};

// API functions: verb + noun
const getUsers = () => {};
const createUser = () => {};
const updateUser = () => {};
const deleteUser = () => {};
```

### Import Order

```typescript
// 1. React and core libraries
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

// 2. Third-party libraries
import { useQuery, useMutation } from "@tanstack/react-query";
import { Box, Typography, Button } from "@mui/material";
import { format } from "date-fns";

// 3. Store/Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/authSlice";

// 4. Components
import { Card, LoadingSpinner, Modal } from "@/components/common";
import { UserForm } from "@/components/features/users";

// 5. Hooks
import { useAuth, useDebounce } from "@/hooks";

// 6. Services
import { userService } from "@/services/userService";

// 7. Types
import type { User, CreateUserPayload } from "@/types";

// 8. Utils/Constants
import { formatDate, formatCurrency } from "@/utils/formatters";
import { API_ENDPOINTS } from "@/utils/constants";

// 9. Styles (if applicable)
import "./UserList.styles.css";
```

---

## Component Guidelines

### Component Structure

```tsx
// UserCard.tsx
import React, { memo } from "react";
import { Card, Typography, Avatar, Chip } from "@mui/material";
import type { User } from "@/types";

// 1. Define Props Interface
interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  isLoading?: boolean;
}

// 2. Define Component with explicit return type
export const UserCard: React.FC<UserCardProps> = memo(
  ({ user, onEdit, onDelete, isLoading = false }) => {
    // 3. Hooks at the top
    const navigate = useNavigate();

    // 4. Derived state
    const fullName = `${user.firstName} ${user.lastName}`;

    // 5. Event handlers
    const handleEdit = () => {
      onEdit?.(user.id);
    };

    const handleDelete = () => {
      onDelete?.(user.id);
    };

    // 6. Early returns for loading/error states
    if (isLoading) {
      return <LoadingSpinner />;
    }

    // 7. Main render
    return (
      <Card>
        <Avatar src={user.profilePicture} />
        <Typography variant="h6">{fullName}</Typography>
        <Typography variant="body2">{user.email}</Typography>
        <Chip label={user.role} />
      </Card>
    );
  },
);

// 8. Display name for debugging
UserCard.displayName = "UserCard";
```

### Component Do's and Don'ts

```tsx
// DO: Use functional components
const UserList: React.FC = () => { ... };

// DO: Extract reusable logic to custom hooks
const useUserData = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
  });
  return { user: data, isLoading, error };
};

// DO: Use memo for expensive components
const UserTable = memo(({ users }: UserTableProps) => { ... });

// DO: Keep components focused (Single Responsibility)
// Each component should do one thing well

// DON'T: Use inline functions in render (creates new reference)
// BAD:
<Button onClick={() => handleClick(user.id)} />
// GOOD:
const handleUserClick = useCallback(() => handleClick(user.id), [user.id]);
<Button onClick={handleUserClick} />

// DON'T: Put business logic in components
// BAD:
const UserList = () => {
  const filteredUsers = users.filter(u => u.isActive && u.role === 'admin');
  // ... lots of logic
};
// GOOD: Extract to hook or utility
const useActiveAdmins = (users: User[]) => {
  return useMemo(() => users.filter(u => u.isActive && u.role === 'admin'), [users]);
};

// DON'T: Use index as key in lists
// BAD:
{users.map((user, index) => <UserCard key={index} user={user} />)}
// GOOD:
{users.map(user => <UserCard key={user.id} user={user} />)}
```

### Component Size Guidelines

| Guideline               | Limit                                 |
| ----------------------- | ------------------------------------- |
| Component lines         | Max 150-200 lines                     |
| Props                   | Max 7-10 props (consider composition) |
| Nested ternaries        | Max 1 level                           |
| useEffect per component | Max 3-4                               |

---

## State Management

### When to Use What

| State Type          | Tool         | Example                       |
| ------------------- | ------------ | ----------------------------- |
| Local UI state      | useState     | Modal open/close, form inputs |
| Complex local state | useReducer   | Multi-step forms              |
| Global app state    | Redux        | User session, UI preferences  |
| Server state        | React Query  | API data, caching             |
| URL state           | React Router | Filters, pagination           |

### Redux Slice Example

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";
import { authService } from "@/services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;

export default authSlice.reducer;
```

### React Query Example

```typescript
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/types";

// Query keys factory
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Fetch users list
export const useUsers = (filters: UserFilters) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single user
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      userService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};
```

---

## API Integration

### Axios Setup

```typescript
// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { store } from "@/store/store";
import { logout } from "@/store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && originalRequest) {
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refreshToken,
          },
        );

        const { accessToken } = response.data.data;
        localStorage.setItem("accessToken", accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        store.dispatch(logout());
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
```

### Service Pattern

```typescript
// services/userService.ts
import { api } from "./api";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
} from "@/types";

interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  department?: string;
  isActive?: boolean;
  search?: string;
}

export const userService = {
  // GET /api/users
  getUsers: async (
    filters: UserFilters = {},
  ): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });

    const { data } = await api.get(`/users?${params.toString()}`);
    return data.data;
  },

  // GET /api/users/:id
  getUser: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data.data.user;
  },

  // POST /api/users
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post("/users", payload);
    return data.data;
  },

  // PUT /api/users/:id
  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data.data;
  },

  // DELETE /api/users/:id
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
```

---

## Styling Guidelines

### Theme Configuration

```typescript
// styles/theme.ts
import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7b1fa2",
    },
    success: {
      main: "#2e7d32",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#ed6c02",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 600 },
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.75rem", fontWeight: 600 },
    h4: { fontSize: "1.5rem", fontWeight: 600 },
    h5: { fontSize: "1.25rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
});
```

### Styled Components Pattern (sx prop)

```tsx
// GOOD: Use sx prop for one-off styles
<Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 2,
    p: 2,
    borderRadius: 1,
    bgcolor: "background.paper",
  }}
>
  {children}
</Box>;

// GOOD: Use styled for reusable styled components
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  "&:hover": {
    boxShadow: theme.shadows[4],
  },
}));
```

### Spacing System

| Spacing | Value | Usage               |
| ------- | ----- | ------------------- |
| 0       | 0px   | No spacing          |
| 1       | 8px   | Minimal spacing     |
| 2       | 16px  | Default spacing     |
| 3       | 24px  | Medium spacing      |
| 4       | 32px  | Large spacing       |
| 5       | 40px  | Extra large spacing |

```tsx
// Use theme spacing
<Box sx={{ p: 2, m: 1, gap: 2 }} /> // padding: 16px, margin: 8px, gap: 16px
```

---

## Form Handling

### React Hook Form + Yup Pattern

```tsx
// components/features/users/UserForm.tsx
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField, Button, Select, MenuItem } from "@mui/material";

// 1. Define validation schema
const userSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),
  phone: yup.string().matches(/^[+]?[\d\s-]+$/, "Invalid phone number format"),
  role: yup
    .string()
    .oneOf(["admin", "manager", "employee"], "Invalid role")
    .required("Role is required"),
  department: yup.string().required("Department is required"),
});

type UserFormData = yup.InferType<typeof userSchema>;

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "employee",
      department: "",
      ...initialData,
    },
    mode: "onBlur", // Validate on blur
  });

  const handleFormSubmit = (data: UserFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Controller
        name="firstName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="First Name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            fullWidth
            margin="normal"
          />
        )}
      />

      <Controller
        name="lastName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Last Name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            fullWidth
            margin="normal"
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            margin="normal"
          />
        )}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Select {...field} label="Role" error={!!errors.role} fullWidth>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="employee">Employee</MenuItem>
          </Select>
        )}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isLoading || !isValid || !isDirty}
        sx={{ mt: 2 }}
      >
        {isLoading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
};
```

---

## Error Handling

### Error Boundary

```tsx
// components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Send to error tracking service (e.g., Sentry)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {this.state.error?.message}
            </Typography>
            <Button variant="contained" onClick={this.handleRetry}>
              Try Again
            </Button>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```tsx
// utils/errorHandler.ts
import toast from "react-hot-toast";

interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export const handleApiError = (error: unknown): void => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error as ApiError;

    if (apiError) {
      // Show main error message
      toast.error(apiError.message);

      // Log validation errors
      if (apiError.details) {
        apiError.details.forEach((detail) => {
          console.error(`${detail.field}: ${detail.message}`);
        });
      }
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred.");
  }
};

// Usage in components
const { mutate, isLoading } = useMutation({
  mutationFn: userService.createUser,
  onError: handleApiError,
  onSuccess: () => {
    toast.success("User created successfully");
  },
});
```

---

## Performance

### Optimization Techniques

```tsx
// 1. Use React.memo for pure components
const UserCard = memo(({ user }: UserCardProps) => {
  return <Card>{user.name}</Card>;
});

// 2. Use useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// 3. Use useCallback for event handlers passed to children
const handleDelete = useCallback(
  (id: string) => {
    deleteUser(id);
  },
  [deleteUser],
);

// 4. Lazy load routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));

// 5. Use virtualization for long lists
import { FixedSizeList } from "react-window";

const VirtualizedList = ({ items }) => (
  <FixedSizeList
    height={400}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => <div style={style}>{items[index].name}</div>}
  </FixedSizeList>
);

// 6. Debounce search inputs
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchUsers({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

---

## Security

### Security Checklist

| Item             | Implementation                                                 |
| ---------------- | -------------------------------------------------------------- |
| XSS Prevention   | Use React's built-in escaping, avoid `dangerouslySetInnerHTML` |
| CSRF Protection  | Include CSRF tokens in requests (handled by backend)           |
| Token Storage    | Store tokens in localStorage with short expiry                 |
| Input Validation | Validate all inputs with Yup before submission                 |
| Sensitive Data   | Never log sensitive data to console                            |
| Dependencies     | Keep dependencies updated, audit regularly                     |

```tsx
// NEVER do this - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// GOOD - React escapes this automatically
<div>{userInput}</div>

// GOOD - Sanitize if HTML is required
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
```

---

## Git Workflow

### Branch Naming

```
feature/user-management     # New features
bugfix/login-error          # Bug fixes
hotfix/critical-security    # Urgent production fixes
refactor/auth-module        # Code refactoring
```

### Commit Messages

```
feat: Add user management module
fix: Fix login authentication bug
docs: Update API documentation
style: Format code with Prettier
refactor: Extract auth logic to custom hook
test: Add unit tests for UserCard
chore: Update dependencies
```

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Testing Done

- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Cross-browser tested

## Screenshots (if applicable)

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No console.logs left
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] Code compiles without errors
- [ ] No TypeScript errors or warnings
- [ ] ESLint passes with no errors
- [ ] All console.logs removed
- [ ] No hardcoded values (use constants)
- [ ] Component has proper types
- [ ] Destructured props at top of component
- [ ] No unused imports or variables

### Reviewer Checklist

- [ ] Code is readable and self-documenting
- [ ] Logic is correct
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Follows established patterns
- [ ] No code duplication
- [ ] Proper loading and error states
