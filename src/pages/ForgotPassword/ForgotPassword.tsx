import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Mail, Loader2, ArrowLeft, CheckCircle, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { authService } from "../../services/authService";
import { getErrorMessage } from "../../utils/errorHandling";
import FormError from "../../components/common/FormError/FormError";
import logoStatic from "../../assets/codecit-logo.png";

// Validation Schemas
const emailSchema = yup.object({
    email: yup.string().email("Please enter a valid email").required("Email is required"),
});

const otpSchema = yup.object({
    otp: yup.string()
        .matches(/^[0-9]{6}$/, "OTP must be exactly 6 digits")
        .required("OTP is required"),
});

const resetSchema = yup.object({
    password: yup.string().required("Password is required").min(6, "Min 6 characters"),
    confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Confirm Password is required"),
});

type ResetFormValues = yup.InferType<typeof resetSchema>;

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
    const [email, setEmail] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | string[] | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Forms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailForm = useForm<{ email: string }>({ resolver: yupResolver(emailSchema) as Resolver<{ email: string }, any> });
    const otpForm = useForm<{ otp: string }>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(otpSchema) as Resolver<{ otp: string }, any>,
        mode: "onChange"
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resetForm = useForm<ResetFormValues>({ resolver: yupResolver(resetSchema) as Resolver<ResetFormValues, any> });

    // Debugging validation errors
    const onInvalid = (errors: unknown) => {
        console.error("Form Validation Errors:", errors);
    };

    // Handlers
    const onEmailSubmit = async (data: { email: string }) => {
        setIsLoading(true);
        setError(null);
        try {
            await authService.forgotPassword(data.email);
            setEmail(data.email);
            setStep("otp");
        } catch (err: unknown) {
            console.error("Forgot Password Error:", err);
            setError(getErrorMessage(err, "Failed to send reset email. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const onOtpSubmit = async (data: { otp: string }) => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await authService.verifyOtp(email, data.otp);
            setResetToken(token);
            setOtpValue(data.otp);
            setStep("reset");
        } catch (err: unknown) {
            console.error("OTP Verification Error caught in handler:", err);
            setError(getErrorMessage(err, "Invalid OTP. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const onResetSubmit = async (data: ResetFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            if (resetToken && resetToken !== otpValue) {
                await authService.resetPassword(data.password, resetToken);
            } else {
                await authService.resetPasswordByOtp(email, otpValue, data.password);
            }
            setStep("success");
        } catch (err: unknown) {
            console.error("Reset Password Error caught in handler:", err);
            setError(getErrorMessage(err, "Failed to reset password. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex">
            {/* Left Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary-dark relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
                    <div className="max-w-md text-center">
                        <div className="mb-8">
                            <div className="w-40 h-40 mx-auto mb-6 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm p-2">
                                <img src={logoStatic} alt="CodecIT Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">CodecIT</h1>
                        <h2 className="text-white/80 text-lg">Human Resource Management</h2>
                    </div>
                </div>
            </div>

            {/* Right Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
                            <img src={logoStatic} alt="CodecIT Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-2xl font-bold text-primary">CodecIT</div>
                    </div>

                    <Link to="/login" className="inline-flex items-center text-sm text-foreground-secondary hover:text-primary mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                    </Link>

                    {/* Header Texts */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            {step === "email" && "Forgot Password?"}
                            {step === "otp" && "Enter Verification Code"}
                            {step === "reset" && "Set New Password"}
                            {step === "success" && "Password Reset Successful"}
                        </h2>
                        <p className="text-foreground-secondary">
                            {step === "email" && "Enter your email address and we'll send you a One-Time Password (OTP)."}
                            {step === "otp" && `We sent a 6-digit code to ${email}. Enter it below.`}
                            {step === "reset" && "Create a new secure password for your account."}
                        </p>
                    </div>

                    {step === "success" ? (
                        <div className="bg-success/10 border border-success/20 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6 text-success" />
                            </div>
                            <p className="text-foreground-secondary mb-6">
                                Your password has been updated successfully.
                            </p>
                            <Link to="/login" className="block w-full py-3 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-colors">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <FormError message={error} />

                            {/* Step 1: Email */}
                            {step === "email" && (
                                <form onSubmit={emailForm.handleSubmit(onEmailSubmit, onInvalid)} className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-foreground-tertiary" />
                                            <input
                                                {...emailForm.register("email")}
                                                id="email"
                                                className={cn("w-full pl-12 pr-4 py-3.5 border rounded-xl", emailForm.formState.errors.email ? "border-error" : "border-border")}
                                                placeholder="admin@codecit.com"
                                            />
                                        </div>
                                        {emailForm.formState.errors.email && <p className="text-sm text-error mt-1">{emailForm.formState.errors.email.message}</p>}
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark flex justify-center items-center">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                                    </button>
                                </form>
                            )}

                            {/* Step 2: OTP */}
                            {step === "otp" && (
                                <form onSubmit={otpForm.handleSubmit(onOtpSubmit, onInvalid)} className="space-y-5">
                                    <div>
                                        <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-foreground-tertiary" />
                                            <input
                                                {...otpForm.register("otp", {
                                                    onChange: (e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                                                        e.target.value = val;
                                                    }
                                                })}
                                                id="otp"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                className={cn("w-full pl-12 pr-4 py-3.5 border rounded-xl tracking-widest font-mono", otpForm.formState.errors.otp ? "border-error" : "border-border")}
                                                placeholder="123456"
                                                maxLength={6}
                                            />
                                        </div>
                                        {otpForm.formState.errors.otp && <p className="text-sm text-error mt-1">{otpForm.formState.errors.otp.message}</p>}
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark flex justify-center items-center">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                                    </button>
                                    <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-primary hover:underline">Change Email</button>
                                </form>
                            )}

                            {/* Step 3: Reset Password */}
                            {step === "reset" && (
                                <form onSubmit={resetForm.handleSubmit(onResetSubmit, onInvalid)} className="space-y-5">
                                    <div>
                                        <label htmlFor="password" title="passwordLabel" className="block text-sm font-medium text-foreground mb-2">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-foreground-tertiary" />
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                {...resetForm.register("password")}
                                                className={cn("w-full pl-12 pr-12 py-3.5 border rounded-xl", resetForm.formState.errors.password ? "border-error" : "border-border")}
                                                placeholder="******"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5">
                                                {showPassword ? <EyeOff className="w-5 h-5 text-foreground-tertiary" /> : <Eye className="w-5 h-5 text-foreground-tertiary" />}
                                            </button>
                                        </div>
                                        {resetForm.formState.errors.password && <p className="text-sm text-error mt-1">{resetForm.formState.errors.password.message}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" title="confirmPasswordLabel" className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-foreground-tertiary" />
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                {...resetForm.register("confirmPassword")}
                                                className={cn("w-full pl-12 pr-12 py-3.5 border rounded-xl", resetForm.formState.errors.confirmPassword ? "border-error" : "border-border")}
                                                placeholder="******"
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5">
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5 text-foreground-tertiary" /> : <Eye className="w-5 h-5 text-foreground-tertiary" />}
                                            </button>
                                        </div>
                                        {resetForm.formState.errors.confirmPassword && <p className="text-sm text-error mt-1">{resetForm.formState.errors.confirmPassword.message}</p>}
                                    </div>

                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark flex justify-center items-center">
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default ForgotPassword;
