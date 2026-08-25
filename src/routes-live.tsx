import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider, useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { lazyLoad } from "./utils/lazyLoad";
import Button from "./components/common/Button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const Dashboard = lazyLoad(() => import("./pages/Dashboard"));
const Users = lazyLoad(() => import("./pages/Users"));
const UserProfile = lazyLoad(() => import("./pages/Users/UserProfile"));
const UserCreate = lazyLoad(() => import("./pages/Users/UserCreate"));
const UserEdit = lazyLoad(() => import("./pages/Users/UserEdit"));
const Attendance = lazyLoad(() => import("./pages/Attendance"));
const AttendanceRecordDetail = lazyLoad(() => import("./pages/Attendance/AttendanceDetails"));
const EmployeeAttendanceDetail = lazyLoad(() => import("./pages/Attendance/EmployeeAttendanceDetail"));
const ScheduleList = lazyLoad(() => import("./pages/Schedule/ScheduleList"));
const Leave = lazyLoad(() => import("./pages/Leave"));
const Announcements = lazyLoad(() => import("./pages/Announcements/AnnouncementsList"));
const AnnouncementFormPage = lazyLoad(() => import("./pages/Announcements/AnnouncementFormPage"));


// Admin / Organization
const LocationsList = lazyLoad(() => import("./pages/Admin/Locations/LocationsList"));
const DepartmentsList = lazyLoad(() => import("./pages/Admin/Departments/DepartmentsList"));
const DesignationsList = lazyLoad(() => import("./pages/Admin/Designations/DesignationsList"));
const HolidaysList = lazyLoad(() => import("./pages/Admin/Holidays/HolidaysList"));
const LeaveTypesList = lazyLoad(() => import("./pages/Admin/LeaveTypes/LeaveTypesList"));
const LeaveBalances = lazyLoad(() => import("./pages/Admin/LeaveBalances/LeaveBalances"));
const ReimbursementsList = lazyLoad(() => import("./pages/Reimbursements/ReimbursementsList"));
const ReimbursementDetails = lazyLoad(() => import("./pages/Reimbursements/ReimbursementDetails"));
const ReimbursementTypesList = lazyLoad(() => import("./pages/Admin/ReimbursementTypes/ReimbursementTypesList"));
const RolesList = lazyLoad(() => import("./pages/Admin/Roles/RolesList"));
const ReportsPage = lazyLoad(() => import("./pages/Reports/ReportsPage"));
const DailyAttendanceReport = lazyLoad(() => import("./pages/Reports/Attendance/DailyAttendance"));
const LeaveHistoryReport = lazyLoad(() => import("./pages/Reports/Leaves/LeaveHistory"));
const HolidayListReport = lazyLoad(() => import("./pages/Reports/Holidays/HolidayList"));
const MonthlyAttendanceReport = lazyLoad(() => import("./pages/Reports/Attendance/MonthlyAttendance"));
const ExceptionReports = lazyLoad(() => import("./pages/Reports/Exceptions/ExceptionReports"));
const OffDayWorkReport = lazyLoad(() => import("./pages/Reports/Holidays/OffDayWorkReport"));
const ComingSoonReport = lazyLoad(() => import("./pages/Reports/ComingSoonReport"));
const ClientsList = lazyLoad(() => import("./pages/Admin/Clients/ClientsList"));
const ClientFormPage = lazyLoad(() => import("./pages/Admin/Clients/ClientFormPage"));
const ClientPortalLayout = lazyLoad(() => import("./components/layout/ClientLayout"));
const TeamDashboard = lazyLoad(() => import("./pages/Portal/TeamDashboard"));

const Login = lazyLoad(() => import("./pages/Login/Login"));
const ForgotPassword = lazyLoad(
  () => import("./pages/ForgotPassword/ForgotPassword"),
);
const ResetPassword = lazyLoad(() => import("./pages/ResetPassword/ResetPassword"));

const Loading = () => <LoadingSpinner fullScreen />;

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  console.error("Route Error:", error);

  let errorMessage = "An unexpected error occurred.";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const isModuleFetchError = errorMessage.includes("Failed to fetch dynamically imported module");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-error" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-4">
        {isModuleFetchError ? "Application Update" : "Oops! Something went wrong"}
      </h1>
      <p className="text-foreground-secondary max-w-md mb-8">
        {isModuleFetchError
          ? "There was an update to the application. Please refresh to get the latest version."
          : errorMessage}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Page
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <Dashboard />
            {/* <Announcements /> */}
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<Loading />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "users",
        element: (
          <Suspense fallback={<Loading />}>
            <Users />
          </Suspense>
        ),
      },
      {
        path: "users/:id",
        element: (
          <Suspense fallback={<Loading />}>
            <UserProfile />
          </Suspense>
        ),
      },
      {
        path: "users/create",
        element: (
          <Suspense fallback={<Loading />}>
            <UserCreate />
          </Suspense>
        ),
      },
      {
        path: "users/edit/:id",
        element: (
          <Suspense fallback={<Loading />}>
            <UserEdit />
          </Suspense>
        ),
      },
      {
        path: "attendance",
        element: (
          <Suspense fallback={<Loading />}>
            <Attendance />
          </Suspense>
        ),
      },
      {
        path: "attendance/record/:date/:userId",
        element: (
          <Suspense fallback={<Loading />}>
            <AttendanceRecordDetail />
          </Suspense>
        ),
      },
      {
        path: "attendance/:employeeId",
        element: (
          <Suspense fallback={<Loading />}>
            <EmployeeAttendanceDetail />
          </Suspense>
        ),
      },
      {
        path: "schedule",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <ScheduleList />
              </Suspense>
            ),
          }
        ],
      },
      {
        path: "leave",
        element: (
          <Suspense fallback={<Loading />}>
            <Leave />
          </Suspense>
        ),
      },
      {
        path: "reimbursements",
        element: (
          <Suspense fallback={<Loading />}>
            <ReimbursementsList />
          </Suspense>
        ),
      },
      {
        path: "reimbursements/:id",
        element: (
          <Suspense fallback={<Loading />}>
            <ReimbursementDetails />
          </Suspense>
        ),
      },
      {
        path: "reports",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <ReportsPage />
              </Suspense>
            ),
          },
          {
            path: "attendance/daily",
            element: (
              <Suspense fallback={<Loading />}>
                <DailyAttendanceReport />
              </Suspense>
            ),
          },
          {
            path: "attendance/monthly",
            element: (
              <Suspense fallback={<Loading />}>
                <MonthlyAttendanceReport />
              </Suspense>
            ),
          },
          {
            path: "leaves/history",
            element: (
              <Suspense fallback={<Loading />}>
                <LeaveHistoryReport />
              </Suspense>
            ),
          },
          {
            path: "holidays/list",
            element: (
              <Suspense fallback={<Loading />}>
                <HolidayListReport />
              </Suspense>
            ),
          },
          {
            path: "holidays/worked-off",
            element: (
              <Suspense fallback={<Loading />}>
                <OffDayWorkReport />
              </Suspense>
            ),
          },
          {
            path: "exceptions/late",
            element: (
              <Suspense fallback={<Loading />}>
                <ExceptionReports />
              </Suspense>
            ),
          },
          {
            path: "exceptions/early",
            element: (
              <Suspense fallback={<Loading />}>
                <ExceptionReports />
              </Suspense>
            ),
          },
          {
            path: "exceptions/missed",
            element: (
              <Suspense fallback={<Loading />}>
                <ExceptionReports />
              </Suspense>
            ),
          },
          {
            path: "*",
            element: (
              <Suspense fallback={<Loading />}>
                <ComingSoonReport />
              </Suspense>
            ),
          }
        ],
      },
      {
        path: "announcements",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <Announcements />
              </Suspense>
            ),
          },
          {
            path: "create",
            element: (
              <Suspense fallback={<Loading />}>
                <AnnouncementFormPage />
              </Suspense>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <Suspense fallback={<Loading />}>
                <AnnouncementFormPage />
              </Suspense>
            ),
          },
        ],
      },

      {
        path: "admin",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <LocationsList />
              </Suspense>
            ),
          },
          {
            path: "locations",
            element: (
              <Suspense fallback={<Loading />}>
                <LocationsList />
              </Suspense>
            ),
          },
          {
            path: "departments",
            element: (
              <Suspense fallback={<Loading />}>
                <DepartmentsList />
              </Suspense>
            ),
          },
          {
            path: "designations",
            element: (
              <Suspense fallback={<Loading />}>
                <DesignationsList />
              </Suspense>
            ),
          },
          {
            path: "holidays",
            element: (
              <Suspense fallback={<Loading />}>
                <HolidaysList />
              </Suspense>
            ),
          },
          {
            path: "leave-types",
            element: (
              <Suspense fallback={<Loading />}>
                <LeaveTypesList />
              </Suspense>
            ),
          },
          {
            path: "reimbursement-types",
            element: (
              <Suspense fallback={<Loading />}>
                <ReimbursementTypesList />
              </Suspense>
            ),
          },
          {
            path: "leave-balances/:userId?",
            element: (
              <Suspense fallback={<Loading />}>
                <LeaveBalances />
              </Suspense>
            ),
          },
          {
            path: "roles",
            element: (
              <Suspense fallback={<Loading />}>
                <RolesList />
              </Suspense>
            ),
          }
        ],
      },
      {
        path: "clients",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <ClientsList />
              </Suspense>
            ),
          },
          {
            path: "create",
            element: (
              <Suspense fallback={<Loading />}>
                <ClientFormPage />
              </Suspense>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <Suspense fallback={<Loading />}>
                <ClientFormPage />
              </Suspense>
            ),
          }
        ]
      },
    ],
  },
  {
    path: "/login",
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/forgot-password",
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: "/reset-password",
    errorElement: <ErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: "/portal",
    element: (
      <ProtectedRoute>
        <ClientPortalLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <TeamDashboard />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Page Under Construction
        </h2>
        <p className="text-foreground-secondary">
          This page is coming soon.
        </p>
      </div>
    ),
  },
],
  { basename: import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, "") || "" }
);

const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
