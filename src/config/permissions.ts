/**
 * Permission Registry — Single source of truth for the Admin Portal
 * Mirrors the backend's PERMISSIONS object in config/constants.js
 *
 * Naming convention: module_action
 */

export const PERMISSIONS = {
    // Employee / User management
    EMPLOYEE_VIEW: 'employee_view',
    EMPLOYEE_CREATE: 'employee_create',
    EMPLOYEE_EDIT: 'employee_edit',
    EMPLOYEE_DELETE: 'employee_delete',

    // Attendance
    ATTENDANCE_VIEW: 'attendance_view',
    ATTENDANCE_EDIT: 'attendance_edit',

    // Schedule
    SCHEDULE_VIEW: 'schedule_view',
    SCHEDULE_MANAGE: 'schedule_manage',

    // Leave
    LEAVE_VIEW: 'leave_view',
    LEAVE_APPROVE: 'leave_approve',
    LEAVE_REJECT: 'leave_reject',

    // Reimbursement
    REIMBURSEMENT_VIEW: 'reimbursement_view',
    REIMBURSEMENT_APPROVE: 'reimbursement_approve',
    REIMBURSEMENT_REJECT: 'reimbursement_reject',
    REIMBURSEMENT_PAY: 'reimbursement_pay',

    // Announcements
    ANNOUNCEMENT_VIEW: 'announcement_view',
    ANNOUNCEMENT_CREATE: 'announcement_create',
    ANNOUNCEMENT_EDIT: 'announcement_edit',
    ANNOUNCEMENT_DELETE: 'announcement_delete',

    // Organization config
    DEPARTMENT_VIEW: 'department_view',
    DEPARTMENT_MANAGE: 'department_manage',
    DESIGNATION_VIEW: 'designation_view',
    DESIGNATION_MANAGE: 'designation_manage',
    LOCATION_VIEW: 'location_view',
    LOCATION_MANAGE: 'location_manage',
    HOLIDAY_VIEW: 'holiday_view',
    HOLIDAY_MANAGE: 'holiday_manage',
    LEAVE_TYPE_MANAGE: 'leave_type_manage',
    LEAVE_BALANCE_MANAGE: 'leave_balance_manage',
    REIMBURSEMENT_TYPE_MANAGE: 'reimbursement_type_manage',
    BREAK_TYPE_MANAGE: 'break_type_manage',

    // Roles
    ROLE_VIEW: 'role_view',
    ROLE_MANAGE: 'role_manage',

    // Reports
    REPORT_VIEW: 'report_view',

    // Clients
    CLIENT_VIEW: 'client_view',
    CLIENT_MANAGE: 'client_manage',

    // Location History
    VIEW_USER_LOCATION_HISTORY: 'view_user_location_history',

    // Dashboard (HD-only)
    DASHBOARD_VIEW: 'dashboard_view',

    // Incidents
    INCIDENT_VIEW: 'incident_view',
    INCIDENT_CREATE: 'incident_create',
    INCIDENT_MANAGE: 'incident_manage',

    // Payroll
    PAYROLL_VIEW: 'payroll_view',
    PAYROLL_MANAGE: 'payroll_manage',

    // Support
    SUPPORT_VIEW: 'support_view',
    SUPPORT_MANAGE: 'support_manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

/** All permission values as an array — useful for "select all" UIs */
export const ALL_PERMISSIONS: PermissionValue[] = Object.values(PERMISSIONS);

/**
 * Grouped permissions for the RoleForm UI
 * Each group has a human-readable label and the list of permission values.
 */
export const PERMISSION_GROUPS: {
    label: string;
    permissions: { id: PermissionValue; label: string }[];
}[] = [
        {
            label: 'Employee Management',
            permissions: [
                { id: PERMISSIONS.EMPLOYEE_VIEW, label: 'View Employees' },
                { id: PERMISSIONS.EMPLOYEE_CREATE, label: 'Create Employees' },
                { id: PERMISSIONS.EMPLOYEE_EDIT, label: 'Edit Employees' },
                { id: PERMISSIONS.EMPLOYEE_DELETE, label: 'Delete Employees' },
            ],
        },
        {
            label: 'Attendance',
            permissions: [
                { id: PERMISSIONS.ATTENDANCE_VIEW, label: 'View Attendance' },
                { id: PERMISSIONS.ATTENDANCE_EDIT, label: 'Edit Attendance' },
            ],
        },
        {
            label: 'Schedule',
            permissions: [
                { id: PERMISSIONS.SCHEDULE_VIEW, label: 'View Schedule' },
                { id: PERMISSIONS.SCHEDULE_MANAGE, label: 'Manage Schedule' },
            ],
        },
        {
            label: 'Leave',
            permissions: [
                { id: PERMISSIONS.LEAVE_VIEW, label: 'View Leave' },
                { id: PERMISSIONS.LEAVE_APPROVE, label: 'Approve Leave' },
                { id: PERMISSIONS.LEAVE_REJECT, label: 'Reject Leave' },
            ],
        },
        {
            label: 'Reimbursements',
            permissions: [
                { id: PERMISSIONS.REIMBURSEMENT_VIEW, label: 'View Reimbursements' },
                { id: PERMISSIONS.REIMBURSEMENT_APPROVE, label: 'Approve Reimbursements' },
                { id: PERMISSIONS.REIMBURSEMENT_REJECT, label: 'Reject Reimbursements' },
                { id: PERMISSIONS.REIMBURSEMENT_PAY, label: 'Mark Reimbursements as Paid' },
            ],
        },
        {
            label: 'Announcements',
            permissions: [
                { id: PERMISSIONS.ANNOUNCEMENT_VIEW, label: 'View Announcements' },
                { id: PERMISSIONS.ANNOUNCEMENT_CREATE, label: 'Create Announcements' },
                { id: PERMISSIONS.ANNOUNCEMENT_EDIT, label: 'Edit Announcements' },
                { id: PERMISSIONS.ANNOUNCEMENT_DELETE, label: 'Delete Announcements' },
            ],
        },
        {
            label: 'Organization',
            permissions: [
                { id: PERMISSIONS.DEPARTMENT_VIEW, label: 'View Departments' },
                { id: PERMISSIONS.DEPARTMENT_MANAGE, label: 'Manage Departments' },
                { id: PERMISSIONS.DESIGNATION_VIEW, label: 'View Designations' },
                { id: PERMISSIONS.DESIGNATION_MANAGE, label: 'Manage Designations' },
                { id: PERMISSIONS.LOCATION_VIEW, label: 'View Locations' },
                { id: PERMISSIONS.LOCATION_MANAGE, label: 'Manage Locations' },
                { id: PERMISSIONS.HOLIDAY_VIEW, label: 'View Holidays' },
                { id: PERMISSIONS.HOLIDAY_MANAGE, label: 'Manage Holidays' },
                { id: PERMISSIONS.LEAVE_TYPE_MANAGE, label: 'Manage Leave Types' },
                { id: PERMISSIONS.LEAVE_BALANCE_MANAGE, label: 'Manage Leave Balances' },
                { id: PERMISSIONS.REIMBURSEMENT_TYPE_MANAGE, label: 'Manage Reimbursement Types' },
                { id: PERMISSIONS.BREAK_TYPE_MANAGE, label: 'Manage Break Types' },
            ],
        },
        {
            label: 'Administration',
            permissions: [
                { id: PERMISSIONS.ROLE_VIEW, label: 'View Roles' },
                { id: PERMISSIONS.ROLE_MANAGE, label: 'Manage Roles' },
                { id: PERMISSIONS.REPORT_VIEW, label: 'View Reports' },
                { id: PERMISSIONS.CLIENT_VIEW, label: 'View Clients' },
                { id: PERMISSIONS.CLIENT_MANAGE, label: 'Manage Clients' },
                { id: PERMISSIONS.INCIDENT_VIEW, label: 'View Incidents' },
                { id: PERMISSIONS.INCIDENT_CREATE, label: 'Create Incidents' },
                { id: PERMISSIONS.INCIDENT_MANAGE, label: 'Manage Incidents' },
                { id: PERMISSIONS.VIEW_USER_LOCATION_HISTORY, label: 'View User Location History' },
                { id: PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard & Analytics' },
                { id: PERMISSIONS.SUPPORT_VIEW, label: 'View Support Tickets' },
                { id: PERMISSIONS.SUPPORT_MANAGE, label: 'Manage Support & Settings' },
            ],
        },
        {
            label: 'Payroll',
            permissions: [
                { id: PERMISSIONS.PAYROLL_VIEW, label: 'View Payroll' },
                { id: PERMISSIONS.PAYROLL_MANAGE, label: 'Manage Payroll' },
            ],
        },
    ];
