import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUser } from "../../store/slices/authSlice";
import GlobalLoader from "../common/LoadingSpinner/GlobalLoader";
import { tokenStorage } from "../../services/api";

interface ProtectedRouteProps {
    children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isInitialized, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    useEffect(() => {
        const hasAccessToken = !!tokenStorage.getAccessToken();
        const hasRefreshToken = !!tokenStorage.getRefreshToken();
        
        console.log('[ProtectedRoute] Check:', { 
            isAuthenticated, 
            isInitialized, 
            userType: user?.userType,
            hasAccessToken,
            hasRefreshToken,
            pathname: location.pathname 
        });
        
        if (isAuthenticated && !user && !isInitialized) {
            console.log('[ProtectedRoute] Authenticated but no user data. Fetching current user...');
            dispatch(fetchCurrentUser());
        }
    }, [isAuthenticated, user, isInitialized, dispatch, location.pathname]);

    // If authenticated but session not yet restored from token, show loading
    if (isAuthenticated && !isInitialized) {
        return <GlobalLoader fullScreen message="Verifying session..." />;
    }

    if (!isAuthenticated) {
        // Redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is authenticated and initialized, check if they are a CLIENT user
    if (isAuthenticated && isInitialized && user && user.userType === 'CLIENT') {
        // CLIENT users should not access the admin portal, redirect to client portal
        // But only if they are not already accessing a portal route
        if (!location.pathname.startsWith('/portal')) {
            return <Navigate to="/portal" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
