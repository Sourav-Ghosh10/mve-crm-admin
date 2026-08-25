import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider, useRouteError, isRouteErrorResponse } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { lazyLoad } from "./utils/lazyLoad";
import Button from "./components/common/Button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { PERMISSIONS } from "./config/permissions";
import SmartHome from "./pages/SmartHome";

const Dashboard = lazyLoad(() => import("./pages/Dashboard"));
const Users = lazyLoad(() => import("./pages/Users"));
const UserProfile = lazyLoad(() => import("./pages/Users/UserProfile"));
const UserCreate = lazyLoad(() => import("./pages/Users/UserCreate"));
const UserEdit = lazyLoad(() => import("./pages/Users/UserEdit"));
const UserLocationHistory = lazyLoad(() => import("./pages/Admin/LocationHistory/UserLocationHistory"));
const Attendance = lazyLoad(() => import("./pages/Attendance"));
const AttendanceRecordDetail = lazyLoad(() => import("./pages/Attendance/AttendanceDetails"));
const EmployeeAttendanceDetail = lazyLoad(() => import("./pages/Attendance/EmployeeAttendanceDetail"));
const ScheduleList = lazyLoad(() => import("./pages/Schedule/ScheduleList"));
const RosterRequests = lazyLoad(() => import("./pages/Schedule/RosterRequests"));
const Leave = lazyLoad(() => import("./pages/Leave"));
const Announcements = lazyLoad(() => import("./pages/Announcements/AnnouncementsList"));
const AnnouncementFormPage = lazyLoad(() => import("./pages/Announcements/AnnouncementFormPage"));
const SupportTickets = lazyLoad(() => import("./pages/Support/SupportTickets"));
const SupportSettings = lazyLoad(() => import("./pages/Support/SupportSettings"));


// Admin / Organization
const LocationsList = lazyLoad(() => import("./pages/Admin/Locations/LocationsList"));
const DepartmentsList = lazyLoad(() => import("./pages/Admin/Departments/DepartmentsList"));
const DesignationsList = lazyLoad(() => import("./pages/Admin/Designations/DesignationsList"));
const HolidaysList = lazyLoad(() => import("./pages/Admin/Holidays/HolidaysList"));
const LeaveTypesList = lazyLoad(() => import("./pages/Admin/LeaveTypes/LeaveTypesList"));
const BreakTypesList = lazyLoad(() => import("./pages/Admin/BreakTypes/BreakTypesList"));
const LeaveBalances = lazyLoad(() => import("./pages/Admin/LeaveBalances/LeaveBalances"));
const ReimbursementsList = lazyLoad(() => import("./pages/Reimbursements/ReimbursementsList"));
const ReimbursementDetails = lazyLoad(() => import("./pages/Reimbursements/ReimbursementDetails"));
const ReimbursementTypesList = lazyLoad(() => import("./pages/Admin/ReimbursementTypes/ReimbursementTypesList"));
const RolesList = lazyLoad(() => import("./pages/Admin/Roles/RolesList"));
const SystemSettings = lazyLoad(() => import("./pages/Admin/SystemSettings/SystemSettings"));
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
const IncidentManagement = lazyLoad(() => import("./pages/Admin/Clients/IncidentManagement"));
const AllowanceDeductionList = lazyLoad(() => import("./pages/Admin/Payroll/AllowanceDeductionList"));
const SalaryConfigList = lazyLoad(() => import("./pages/Payroll/SalaryConfigs/SalaryConfigList"));
const PayslipList = lazyLoad(() => import("./pages/Payroll/Payslips/PayslipList"));
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
          onClick={() => window.location.href = "/"}
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
        element: <SmartHome />,
      },
      {
        path: "dashboard",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.DASHBOARD_VIEW]}>
            <Suspense fallback={<Loading />}>
              <Dashboard />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "users",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.EMPLOYEE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <Users />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.EMPLOYEE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <UserProfile />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "users/create",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.EMPLOYEE_CREATE]}>
            <Suspense fallback={<Loading />}>
              <UserCreate />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "users/edit/:id",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.EMPLOYEE_EDIT]}>
            <Suspense fallback={<Loading />}>
              <UserEdit />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "users/:userId/location-history",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.VIEW_USER_LOCATION_HISTORY]}>
            <Suspense fallback={<Loading />}>
              <UserLocationHistory />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "attendance",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <Attendance />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "attendance/record/:date/:userId",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <AttendanceRecordDetail />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "attendance/:employeeId",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <EmployeeAttendanceDetail />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "schedule",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute permissions={[PERMISSIONS.SCHEDULE_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ScheduleList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "requests",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.SCHEDULE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <RosterRequests />
                </Suspense>
              </PermissionRoute>
            ),
          }
        ],
      },
      {
        path: "leave",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.LEAVE_VIEW]}>
            <Suspense fallback={<Loading />}>
              <Leave />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "reimbursements",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.REIMBURSEMENT_VIEW]}>
            <Suspense fallback={<Loading />}>
              <ReimbursementsList />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "reimbursements/:id",
        element: (
          <PermissionRoute permissions={[PERMISSIONS.REIMBURSEMENT_VIEW]}>
            <Suspense fallback={<Loading />}>
              <ReimbursementDetails />
            </Suspense>
          </PermissionRoute>
        ),
      },
      {
        path: "reports",
        children: [
          {
            index: true,
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ReportsPage />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "attendance/daily",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <DailyAttendanceReport />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "attendance/monthly",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <MonthlyAttendanceReport />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "leaves/history",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <LeaveHistoryReport />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "holidays/list",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <HolidayListReport />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "holidays/worked-off",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <OffDayWorkReport />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "exceptions/late",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ExceptionReports />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "exceptions/early",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ExceptionReports />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "exceptions/missed",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ExceptionReports />
                </Suspense>
              </PermissionRoute>
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
              <PermissionRoute permissions={[PERMISSIONS.ANNOUNCEMENT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <Announcements />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "create",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.ANNOUNCEMENT_CREATE]}>
                <Suspense fallback={<Loading />}>
                  <AnnouncementFormPage />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.ANNOUNCEMENT_EDIT]}>
                <Suspense fallback={<Loading />}>
                  <AnnouncementFormPage />
                </Suspense>
              </PermissionRoute>
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
              <PermissionRoute permissions={[PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <LocationsList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "locations",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <LocationsList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "departments",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.DEPARTMENT_VIEW, PERMISSIONS.DEPARTMENT_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <DepartmentsList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "designations",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.DESIGNATION_VIEW, PERMISSIONS.DESIGNATION_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <DesignationsList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "holidays",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.HOLIDAY_VIEW, PERMISSIONS.HOLIDAY_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <HolidaysList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "leave-types",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.LEAVE_TYPE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <LeaveTypesList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "break-types",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.BREAK_TYPE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <BreakTypesList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "reimbursement-types",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.REIMBURSEMENT_TYPE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <ReimbursementTypesList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "leave-balances/:userId?",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.LEAVE_BALANCE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <LeaveBalances />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "roles",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <RolesList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.ROLE_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <SystemSettings />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "payroll-masters",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <AllowanceDeductionList />
                </Suspense>
              </PermissionRoute>
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
              <PermissionRoute permissions={[PERMISSIONS.CLIENT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <ClientsList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "create",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.CLIENT_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <ClientFormPage />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "edit/:id",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.CLIENT_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <ClientFormPage />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "incidents",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.INCIDENT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <IncidentManagement />
                </Suspense>
              </PermissionRoute>
            ),
          },
        ],
      },
      {
        path: "support",
        children: [
          {
            path: "tickets",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.SUPPORT_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <SupportTickets />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "settings",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.SUPPORT_MANAGE]}>
                <Suspense fallback={<Loading />}>
                  <SupportSettings />
                </Suspense>
              </PermissionRoute>
            ),
          },
        ],
      },
      {
        path: "payroll",
        children: [
          {
            path: "salary-configs",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.PAYROLL_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <SalaryConfigList />
                </Suspense>
              </PermissionRoute>
            ),
          },
          {
            path: "payslips",
            element: (
              <PermissionRoute permissions={[PERMISSIONS.PAYROLL_VIEW]}>
                <Suspense fallback={<Loading />}>
                  <PayslipList />
                </Suspense>
              </PermissionRoute>
            ),
          },
        ],
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
      // {
      //   path: "team",
      //   element: (
      //     <Suspense fallback={<Loading />}>
      //       <TeamDashboard />
      //     </Suspense>
      //   ),
      // },
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
