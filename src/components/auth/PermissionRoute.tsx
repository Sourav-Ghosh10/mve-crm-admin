import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAnyPermission } from '../../hooks/usePermissions';

interface PermissionRouteProps {
    /** At least one of these permissions is required to view the route */
    permissions: string[];
    /** The element to render if the user has the required permission */
    children: React.ReactNode;
    /** Where to redirect if denied. Defaults to "/" */
    redirectTo?: string;
}

/**
 * Route guard component that checks if the current user has at least one of the
 * required permissions before rendering the child route content.
 *
 * Super Admins bypass this check automatically (handled inside useAnyPermission).
 *
 * Usage:
 * ```tsx
 * <PermissionRoute permissions={[PERMISSIONS.EMPLOYEE_VIEW]}>
 *   <UsersPage />
 * </PermissionRoute>
 * ```
 */
const PermissionRoute: React.FC<PermissionRouteProps> = ({
    permissions,
    children,
    redirectTo = '/',
}) => {
    const hasAccess = useAnyPermission(...permissions);

    if (!hasAccess) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};

export default PermissionRoute;
