"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { registerUser } from "@/actions/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Check, X, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { sendOTP, verifyOTPAndRegister } from "@/actions/otp";


import { registerSchema } from "@/lib/validations";

const PasswordStrength = ({ password }) => {
    const [strength, setStrength] = useState(0);

    useEffect(() => {
        let score = 0;
        if (!password) {
            setStrength(0);
            return;
        }

        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        setStrength(score);
    }, [password]);

    const getColor = (score) => {
        if (score <= 2) return "bg-red-500";
        if (score <= 3) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getLabel = (score) => {
         if (score <= 2) return "Weak";
         if (score <= 3) return "Medium";
         return "Strong";
    };

    return (
        <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
                <span>Password Strength:</span>
                <span className={`font-medium ${strength <= 2 ? "text-red-500" : strength <= 3 ? "text-yellow-500" : "text-green-500"}`}>
                    {getLabel(strength)}
                </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${getColor(strength)}`} 
                    style={{ width: `${(strength / 5) * 100}%` }}
                />
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground mt-2">
                <li className="flex items-center gap-2">
                    {password?.length >= 8 ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
                    At least 8 characters
                </li>
                 <li className="flex items-center gap-2">
                    {/[A-Z]/.test(password || "") ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                    Uppercase letter
                </li>
                 <li className="flex items-center gap-2">
                    {/[a-z]/.test(password || "") ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                    Lowercase letter
                </li>
                <li className="flex items-center gap-2">
                    {/[^A-Za-z0-9]/.test(password || "") ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                    Special character
                </li>
            </ul>
        </div>
    );
};

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        referralCode: "",
    }
  });
  
  const password = watch("password");

  const onContinue = async (data) => {
      setIsLoading(true);
      try {
           // Basic validation is done by Zod.
           // Step 1: Send OTP
           await sendOTP(data.email);
           setFormData(data); // Save data for step 2
           setStep(2);
           toast.success("Verification code sent to your email.");
      } catch (error) {
          toast.error(error.message || "Failed to send code.");
      } finally {
          setIsLoading(false);
      }
  };

  const onVerify = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          if (!otp || otp.length !== 6) throw new Error("Please enter a valid 6-digit code");
          
          await verifyOTPAndRegister(formData, otp);
          
          toast.success("Account created! Please sign in.");
          router.push("/sign-in");
      } catch (error) {
           toast.error(error.message || "Verification failed");
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
              {step === 1 ? "Create Account" : "Verify Email"}
          </CardTitle>
          <CardDescription className="text-center">
              {step === 1 ? "Sign up to get started" : `Enter the code sent to ${formData?.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
              <form onSubmit={handleSubmit(onContinue, (errors) => {
                 if (errors.email) toast.error("Please enter a valid email address");
              })} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input key="name" {...register("name")} placeholder="Name" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input key="email" {...register("email")} type="email" placeholder="Email" />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input key="password" {...register("password")} type={showPassword ? "text" : "password"} className="pr-10" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                  <PasswordStrength password={password} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input 
                    key="confirmPassword" 
                    {...register("confirmPassword")} 
                    type="password" 
                    placeholder="Confirm Password"
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Referral Code (Optional)</label>
                  <Input key="referralCode" {...register("referralCode")} className="uppercase" />
                  {errors.referralCode && <p className="text-sm text-red-500">{errors.referralCode.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </form>
          ) : (
             <form onSubmit={onVerify} className="space-y-4">
                 <div className="space-y-2">
                     <label className="text-sm font-medium">Verification Code</label>
                     <Input 
                        key="otp"
                        value={otp || ""} 
                        onChange={(e) => setOtp(e.target.value)} 
                        placeholder="123456" 
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                     />
                 </div>
                 <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Create Account
                 </Button>
                 <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                 >
                    Back to Details
                 </Button>
             </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
                Already have an account? <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>
            </p>
        </CardFooter>
      </Card>
  );
}

