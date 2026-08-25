import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Eye, EyeOff, AlertCircle, Mail, Lock, Loader2 } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { login, loginWithGoogle, clearError } from "../../store/slices/authSlice";
import { tokenStorage } from "../../services/api";
import { cn } from "../../lib/utils";
// import logoAnimated from "../../assets/pulse-ops-logo-animated.mp4";
import logoStatic from "../../assets/codecit-logo.png";
import Button from "../../components/common/Button";

const loginSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  checked: yup.boolean().required(),
  // favourite: yup.boolean().required(),
  // admin: yup.boolean().required(),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  );
  const [showPassword, setShowPassword] = useState(false);
  const hasStoredTokens = !!(
    tokenStorage.getAccessToken() && tokenStorage.getRefreshToken()
  );
  const [logoutMessage] = useState<string | null>(() => {
    const reason = sessionStorage.getItem("logoutReason");
    const message = sessionStorage.getItem("logoutMessage");
    return reason && message ? message : null;
  });

  useEffect(() => {
    sessionStorage.removeItem("logoutReason");
    sessionStorage.removeItem("logoutMessage");
  }, []);

  const {
    control,
    handleSubmit,
    // register,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(loginSchema) as Resolver<LoginFormData, any>,
    defaultValues: {
      email: "",
      password: "",
      checked: false,      
    },
  });

  /* Removed useGoogleLogin hook */

  useEffect(() => {
    if (isAuthenticated || hasStoredTokens) {
      const fromPath =
        (location.state as { from?: { pathname?: string } })?.from?.pathname;
      const fallbackPath = user?.userType === "CLIENT" ? "/portal" : "/";
      const normalizePath = (path: string) =>
        path.length > 1 ? path.replace(/\/+$/, "") : path;
      const normalizedFromPath = fromPath ? normalizePath(fromPath) : undefined;
      const isAuthRoute = (path: string) =>
        /^\/(login|forgot-password|reset-password)(\/|$)/.test(path);
      const targetPath =
        normalizedFromPath && !isAuthRoute(normalizedFromPath)
          ? normalizedFromPath
          : fallbackPath;

      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, hasStoredTokens, navigate, location.state, user?.userType]);




  // Load saved email if exists
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setValue("email", savedEmail);
      // setValue("rememberMe", true);
    }
  }, [setValue]);

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    await dispatch(loginWithGoogle(true));
  };

  const onSubmit = async (data: LoginFormData) => {
    // if (data.rememberMe) {
    //   localStorage.setItem("rememberedEmail", data.email);
    // } else {
    //   localStorage.removeItem("rememberedEmail");
    // }
    dispatch(login({
      email: data.email,
      password: data.password,
      checked: true,
    }));
  };

  return (
    <main id="main-content" className="min-h-screen flex">
      {/* Left side - Branding with Animated Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-dark relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="max-w-md text-center">
            {/* Animated Logo */}
            <div className="mb-8">
              <div className="w-40 h-40 mx-auto mb-6 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm p-2">
                
                <img
                  src={logoStatic}
                  alt="CodecIT Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-4xl font-bold mb-2">CodecIT</h1>
              <h2 className="text-white/80 text-lg">Human Resource Management</h2>
            </div>

            {/* Features */}
            <div className="space-y-4 text-left mt-12">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Streamlined HR Operations</h3>
                  <p className="text-sm text-white/70">
                    Manage your workforce efficiently
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Attendance</h3>
                  <p className="text-sm text-white/70">
                    Track attendance with precision
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/15 transition-colors">
                <div className="w-10 h-10 bg-info rounded-lg flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Analytics Dashboard</h3>
                  <p className="text-sm text-white/70">
                    Data-driven HR decisions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={logoStatic}
                alt="CodecIT Logo"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-2xl font-bold text-primary">CodecIT</div>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-foreground-secondary">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-error/10 border border-error/20 rounded-xl text-error animate-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Session Invalidation Alert */}
          {logoutMessage && (
            <div className="flex items-center gap-3 p-4 mb-6 bg-warning/10 border border-warning/20 rounded-xl text-warning animate-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{logoutMessage}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-foreground-tertiary" />
                    </div>
                    <input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear error when user starts typing
                        if (error) {
                          dispatch(clearError());
                        }
                      }}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@pulseops.com"
                      className={cn(
                        "w-full pl-12 pr-4 py-3.5 border rounded-xl transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                        "placeholder:text-foreground-tertiary bg-surface",
                        errors.email
                          ? "border-error focus:ring-error"
                          : "border-border hover:border-foreground-secondary",
                      )}
                    />
                  </div>
                )}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-foreground-tertiary" />
                    </div>
                    <input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear error when user starts typing
                        if (error) {
                          dispatch(clearError());
                        }
                      }}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={cn(
                        "w-full pl-12 pr-12 py-3.5 border rounded-xl transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                        "placeholder:text-foreground-tertiary bg-surface",
                        errors.password
                          ? "border-error focus:ring-error"
                          : "border-border hover:border-foreground-secondary",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground-tertiary hover:text-foreground transition-colors h-auto w-auto"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                )}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                {/* <input
                  type="checkbox"
                  // {...register("rememberMe")}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-foreground-secondary">
                  Remember me
                </span> */}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                tabIndex={0}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              fullWidth
              className={cn(
                "py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300",
                "bg-gradient-to-r from-primary to-primary-dark",
                "hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
                "flex items-center justify-center gap-2 h-auto",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-foreground-tertiary">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              fullWidth
              className={cn(
                "py-3.5 px-6 rounded-xl font-semibold border border-border text-foreground transition-all duration-300",
                "bg-white hover:bg-gray-50 h-auto",
                "hover:shadow-md hover:-translate-y-0.5",
                "focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2",
                "flex items-center justify-center gap-3",
              )}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign In with Google
            </Button>
          </form>

          {/* Demo Credentials */}
          {/* <div className="mt-8 p-4 bg-muted rounded-xl border border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              Demo Credentials
            </p>
            <div className="space-y-1 text-sm text-foreground-secondary">
              <p>
                <span className="text-foreground-tertiary">Email:</span>{" "}
                <code className="px-1.5 py-0.5 bg-background rounded text-primary font-mono text-xs">
                  reshab@hashtagbizsolutions.com
                </code>
              </p>
              <p>
                <span className="text-foreground-tertiary">Password:</span>{" "}
                <code className="px-1.5 py-0.5 bg-background rounded text-primary font-mono text-xs">
                  DemoUser123!
                </code>
              </p>
            </div>
          </div> */}

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-foreground-tertiary">
            &copy; {new Date().getFullYear()} CodecIT. All rights reserved.
          </p>
        </div>
      </div>
    </main>
    );
};

export default Login;
