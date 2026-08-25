import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "../../lib/utils";
import { authService } from "../../services/authService";
// import logoAnimated from "../../assets/pulse-ops-logo-animated.mp4";
import logoStatic from "../../assets/codecit-logo.png";
import { getErrorMessage } from "../../utils/errorHandling";
import FormError from "../../components/common/FormError/FormError";

const resetPasswordSchema = yup.object({
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: yup
        .string()
        .required("Confirm Password is required")
        .oneOf([yup.ref("password")], "Passwords must match"),
}).required();

interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
}



const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | string[] | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(resetPasswordSchema) as Resolver<ResetPasswordFormData, any>,
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError("Invalid reset token.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await authService.resetPassword(data.password, token);
            setIsSuccess(true);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to reset password. Link might be expired."));
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full bg-surface p-8 rounded-xl shadow-lg border border-border text-center">
                    <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Request</h2>
                    <p className="text-foreground-secondary mb-6">
                        Missing reset token. Please check the link from your email.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-dark relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                </div>
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
                    <div className="max-w-md text-center">
                        <div className="mb-8">
                            <div className="w-40 h-40 mx-auto mb-6 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm p-2">
                                <img
                                    src={logoStatic}
                                    alt="CodecIT Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h1 className="text-4xl font-bold mb-2">CodecIT</h1>
                            <h2 className="text-white/80 text-lg">Human Resource Management</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={logoStatic}
                                alt="CodecIT Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-2xl font-bold text-primary">CodecIT</div>
                    </div>

                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm text-foreground-secondary hover:text-primary mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Reset Password
                        </h2>
                        <p className="text-foreground-secondary">
                            Enter your new password below.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6 text-success" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">Password Reset Successful</h3>
                            <p className="text-foreground-secondary mb-6">
                                Your password has been updated. You can now login with your new password.
                            </p>
                            <Link
                                to="/login"
                                className="block w-full py-3 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <FormError message={error} />

                            {/* Password Field */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-foreground mb-2"
                                >
                                    New Password
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
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                className={cn(
                                                    "w-full pl-12 pr-12 py-3.5 border rounded-xl transition-all duration-200",
                                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    "placeholder:text-foreground-tertiary bg-surface",
                                                    errors.password
                                                        ? "border-error focus:ring-error"
                                                        : "border-border hover:border-foreground-secondary",
                                                )}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground-tertiary hover:text-foreground transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-error">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium text-foreground mb-2"
                                >
                                    Confirm Password
                                </label>
                                <Controller
                                    name="confirmPassword"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-foreground-tertiary" />
                                            </div>
                                            <input
                                                {...field}
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                className={cn(
                                                    "w-full pl-12 pr-12 py-3.5 border rounded-xl transition-all duration-200",
                                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                                                    "placeholder:text-foreground-tertiary bg-surface",
                                                    errors.confirmPassword
                                                        ? "border-error focus:ring-error"
                                                        : "border-border hover:border-foreground-secondary",
                                                )}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-foreground-tertiary hover:text-foreground transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-5 h-5" />
                                                ) : (
                                                    <Eye className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-error">
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300",
                                    "bg-gradient-to-r from-primary to-primary-dark",
                                    "hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5",
                                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                    "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
                                    "flex items-center justify-center gap-2",
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    "Set New Password"
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ResetPassword;
