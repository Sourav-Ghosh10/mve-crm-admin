import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { PERMISSIONS } from '../../config/permissions';

/**
 * A list of candidate landing pages in priority order.
 * The user is redirected to the first page they have permission to access.
 */
const LANDING_CANDIDATES: { path: string; permissions: string[] }[] = [
    { path: '/announcements', permissions: [PERMISSIONS.ANNOUNCEMENT_VIEW] },
    { path: '/users', permissions: [PERMISSIONS.EMPLOYEE_VIEW] },
    { path: '/attendance', permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
    { path: '/schedule', permissions: [PERMISSIONS.SCHEDULE_VIEW] },
    { path: '/leave', permissions: [PERMISSIONS.LEAVE_VIEW] },
    { path: '/reimbursements', permissions: [PERMISSIONS.REIMBURSEMENT_VIEW] },
    { path: '/admin/locations', permissions: [PERMISSIONS.LOCATION_VIEW, PERMISSIONS.LOCATION_MANAGE] },
    { path: '/clients', permissions: [PERMISSIONS.CLIENT_VIEW] },
];

/**
 * SmartHome checks the user's permissions and redirects to the first
 * module they have access to. If no module is accessible, it shows a
 * simple "no access" message.
 */
const SmartHome: React.FC = () => {
    const permissions = useSelector((state: RootState) => state.auth.permissions);
    const user = useSelector((state: RootState) => state.auth.user);

    const roleName =
        user?.employment?.role && typeof user.employment.role === 'object'
            ? (user.employment.role as { name?: string }).name
            : user?.employment?.role;

    const isSuperAdmin = roleName === 'Super Admin';

    // Super Admin goes to dashboard
    if (isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    // Client users (by userType) go to their team portal
    if (user?.userType === 'CLIENT') {
        return <Navigate to="/portal" replace />;
    }

    // Fallback: also check legacy roleName for backward compatibility
    if (roleName === 'Client') {
        return <Navigate to="/portal" replace />;
    }

    // Find the first module the user has access to
    for (const candidate of LANDING_CANDIDATES) {
        const hasAccess = candidate.permissions.some((p) => permissions.includes(p));
        if (hasAccess) {
            return <Navigate to={candidate.path} replace />;
        }
    }

    // No permissions at all — show a message
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v.01M12 9v3m0-9a9 9 0 110 18 9 9 0 010-18z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Access</h2>
            <p className="text-foreground-secondary max-w-md">
                Your account doesn't have permissions to access any modules yet.
                Please contact your administrator to get the appropriate access.
            </p>
        </div>
    );
};

export default SmartHome;
