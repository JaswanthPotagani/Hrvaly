"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendPasswordResetOTP, verifyPasswordResetOTP, resetPasswordWithOTP } from "@/actions/auth";

// Schema for Step 1: Email
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for Step 2: OTP
const otpSchema = z.object({
  otp: z.string().min(6, "Code must be 6 digits"),
});

// Schema for Step 3: New Password
const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Step 1 Handlers ---
  const { register: registerEmail, handleSubmit: handleSubmitEmail, formState: { errors: emailErrors } } = useForm({
    resolver: zodResolver(emailSchema),
  });

  const onEmailSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await sendPasswordResetOTP(data.email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification code sent!");
        setEmail(data.email);
        setStep(2);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2 Handlers ---
  const { register: registerOtp, handleSubmit: handleSubmitOtp, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  const onOtpSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await verifyPasswordResetOTP(email, data.otp);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Code verified!");
        setOtp(data.otp);
        setStep(3);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 3 Handlers ---
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await resetPasswordWithOTP(email, otp, data.password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset successfully! Please login.");
        router.push("/sign-in");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Reset Password"}
        </CardTitle>
        <CardDescription>
            {step === 1 && "Enter your email to receive a verification code"}
            {step === 2 && `We sent a code to ${email}`}
            {step === 3 && "Create a new password for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1: Email Form */}
        {step === 1 && (
          <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input {...registerEmail("email")} type="email" placeholder="Email" autoFocus />
              {emailErrors.email && <p className="text-sm text-red-500">{emailErrors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Code
            </Button>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === 2 && (
          <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input 
                {...registerOtp("otp")} 
                placeholder="123456" 
                maxLength={6} 
                className="text-center text-lg tracking-widest"
                autoFocus 
              />
              {otpErrors.otp && <p className="text-sm text-red-500">{otpErrors.otp.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
            <div className="text-center">
                 <Button variant="link" size="sm" type="button" onClick={() => setStep(1)} className="text-muted-foreground">
                    Change Email
                 </Button>
            </div>
          </form>
        )}

        {/* Step 3: Password Form */}
        {step === 3 && (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input {...registerPassword("password")} type={showPassword ? "text" : "password"} placeholder="New Password" />
                 <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.password && <p className="text-sm text-red-500">{passwordErrors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input {...registerPassword("confirmPassword")} type="password" placeholder="Confirm Password" />
              {passwordErrors.confirmPassword && <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        )}

      </CardContent>

      {step === 1 && (
          <CardFooter className="flex justify-center">
            <Link href="/sign-in" className="text-sm text-primary hover:underline flex items-center">
                <ArrowLeft className="h-3 w-3 mr-1" /> Back to Sign In
            </Link>
        </CardFooter>
      )}
    </Card>
  );
}
