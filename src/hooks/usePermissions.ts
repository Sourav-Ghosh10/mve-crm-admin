import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

/**
 * Custom hook to check if the current user has the required permission(s).
 *
 * @param requiredPerm - A single permission string or an array of permission strings.
 *                       When an array is given, the user must have ALL of them.
 * @returns Object with:
 *   - hasPermission: boolean
 *   - permissions: the full list of user permissions
 *   - isSuperAdmin: whether the user has the 'Super Admin' role
 *
 * Usage:
 *   const { hasPermission } = usePermissions('leave_approve');
 *   const { hasPermission } = usePermissions(['leave_approve', 'leave_reject']);
 */
export const usePermissions = (requiredPerm?: string | string[]) => {
    const permissions = useSelector((state: RootState) => state.auth.permissions);
    const user = useSelector((state: RootState) => state.auth.user);

    const roleName =
        user?.employment?.role && typeof user.employment.role === 'object'
            ? (user.employment.role as { name?: string }).name
            : user?.employment?.role;

    // Only the 'Super Admin' role bypasses all permission checks.
    const isSuperAdmin = roleName === 'Super Admin';

    let hasPermission = false;

    if (isSuperAdmin) {
        // Super Admin always has all permissions
        hasPermission = true;
    } else if (!requiredPerm) {
        // No specific permission required — just return the permissions list
        hasPermission = true;
    } else if (typeof requiredPerm === 'string') {
        hasPermission = permissions.includes(requiredPerm);
    } else if (Array.isArray(requiredPerm)) {
        hasPermission = requiredPerm.every((p) => permissions.includes(p));
    }

    return { hasPermission, permissions, isSuperAdmin };
};

/**
 * Check if any one of the given permissions is present.
 * Useful for showing a section if the user has at least one relevant permission.
 */
export const useAnyPermission = (...perms: string[]) => {
    const { permissions, isSuperAdmin } = usePermissions();

    if (isSuperAdmin) return true;
    return perms.some((p) => permissions.includes(p));
};
