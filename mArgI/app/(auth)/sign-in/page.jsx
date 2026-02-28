"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { loginUser } from "@/actions/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { loginSchema } from "@/lib/validations";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log("[SIGN-IN-UI] onSubmit started");
    try {
      console.log("[SIGN-IN-UI] Calling loginUser action...");
      const result = await loginUser(data);
      console.log("[SIGN-IN-UI] loginUser result:", result);
      
      if (result.error) {
        console.error("[SIGN-IN-UI] Login error result:", result.error);
        toast.error(result.error);
      } else {
        console.log("[SIGN-IN-UI] Login success - redirecting to /dashboard");
        toast.success("Signed in successfully");
        router.push("/dashboard"); 
        router.refresh();
      }
    } catch (error) {
      console.error("[SIGN-IN-UI] Unexpected error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input {...register("email")} type="email" placeholder="Email" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Password" className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
                Don&apos;t have an account? <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
            </p>
        </CardFooter>
      </Card>
  );
}
