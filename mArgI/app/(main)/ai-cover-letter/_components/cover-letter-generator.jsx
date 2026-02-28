"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Briefcase, Building2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/app/hooks/use-fetch";
import { coverLetterSchema } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CoverLetterGenerator() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
    defaultValues: {
      companyName: "",
      jobTitle: "",
      jobDescription: "",
    }
  });

  const [generateLetterFn, generatedLetter, generating] = useFetch(generateCoverLetter);

  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      reset();
    }
  }, [generatedLetter, reset, router]);

  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto pb-24" // Added padding bottom
    >
      <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-2xl relative">
        {/* Decorative background elements wrapped in a clipped container */}
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
        </div>

        <CardHeader className="relative z-10 border-b border-border/50 pb-6">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-primary/20 p-2 rounded-lg text-primary">
              <Briefcase className="h-5 w-5" />
            </span>
            Job Details
          </CardTitle>
          <CardDescription>
            Provide the specifics of the role to generate a hyper-personalized cover letter.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-base font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google, Microsoft, Startup Inc."
                  className="bg-background/50 border-input/50 focus:border-primary/50 transition-all h-12"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-400 font-medium">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="jobTitle" className="text-base font-medium flex items-center gap-2">
                   <Briefcase className="h-4 w-4 text-muted-foreground" />
                   Job Title
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Frontend Engineer"
                  className="bg-background/50 border-input/50 focus:border-primary/50 transition-all h-12"
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-400 font-medium">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="jobDescription" className="text-base font-medium flex items-center gap-2">
                 <FileText className="h-4 w-4 text-muted-foreground" />
                 Job Description
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the full job description here. Our AI will analyze key requirements and align your skills..."
                className="h-48 bg-background/50 border-input/50 focus:border-primary/50 transition-all resize-y leading-relaxed"
                {...register("jobDescription")}
              />
               {errors.jobDescription && (
                  <p className="text-sm text-red-400 font-medium">
                    {errors.jobDescription.message}
                  </p>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button type="submit" disabled={generating} size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-lg px-8">
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing & Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 fill-current" />
                    Generate My Cover Letter
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}