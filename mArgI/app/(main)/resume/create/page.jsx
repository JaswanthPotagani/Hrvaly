"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createResume } from "@/actions/resume";
import useFetch from "@/app/hooks/use-fetch";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { resumeTitleSchema } from "@/lib/validations";

export default function CreateResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") || "professional";

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resumeTitleSchema),
  });

  const [createResumeFn, newResume, loading, error] = useFetch(createResume);

  const onSubmit = async (data) => {
    await createResumeFn(data.title, templateId);
  };

  useEffect(() => {
    if (newResume) {
      toast.success("Resume created successfully!");
      router.push(`/resume/${newResume.id}?initialTitle=${newResume.title}&template=${templateId}`);
    }
  }, [newResume, router, templateId]);

  return (
    <div className="container mx-auto py-10 max-w-lg px-4">
      <Card className="border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold gradient-title">Create New Resume</CardTitle>
          <CardDescription>
            Give your resume a name to get started. You can change this later.
          </CardDescription>
        </CardHeader>
        <CardContent>


          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Resume Title</label>
              <Input
                id="title"
                placeholder="e.g., Software Engineer Resume"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Resume"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
