import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  referralCode: z.string().optional().refine(val => !val || val.toUpperCase() === "MARGI25", {
    message: "Invalid referral code"
  }),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const onboardingSchema = z.object({
    userType: z.enum(["student", "professional"], {
        required_error: "Please select if you are a student or professional",
    }),
    industry: z.string({
        required_error: "Please select an industry",
    }),
    subIndustry: z.string({
        required_error: "Please select a specialization",
    }),
    specialization: z.string().optional(),
    bio: z.string().max(500).optional(),
    experience: z.string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : 0)
        .pipe(z.number().min(0, "Experience must be at least 0 years").max(50, "Experience cannot exceed 50 years")),
    
    college: z.string().optional(),
    branch: z.string().optional(),
    degree: z.enum(["B.Tech", "M.Tech", "Degree"]).optional(),
    isGraduated: z.boolean().optional(),
    currentYear: z.string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : undefined)
        .pipe(z.number().min(1).max(4).optional()),
    graduationYear: z.string()
        .optional()
        .transform((val) => val ? parseInt(val, 10) : undefined)
        .pipe(z.number().min(1950).max(new Date().getFullYear()).optional()),
    location: z.string().min(1, "Location is required"),

    skills: z.string().transform((val) => 
        val ? val.split(",").map((skill) => skill.trim()).filter(Boolean) : []
    ).optional(),
    
}).superRefine((data, ctx) => {
    // Student validation
    if (data.userType === "student") {
        if (!data.college || data.college.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "College name is required for students",
                path: ["college"],
            });
        }
        if (!data.branch || data.branch.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Branch/Department is required for students",
                path: ["branch"],
            });
        }
        if (!data.degree) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Degree is required for students",
                path: ["degree"],
            });
        }
        
        const hasCurrentYear = data.currentYear !== undefined && data.currentYear !== null;
        const hasGraduationInfo = data.isGraduated === true;
        
        if (hasCurrentYear && hasGraduationInfo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Cannot specify both current year and graduated status",
                path: ["currentYear"],
            });
        }
        
        if (!hasCurrentYear && !hasGraduationInfo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please specify either your current year or mark as graduated",
                path: ["currentYear"],
            });
        }
        
        if (hasCurrentYear && data.degree) {
            const maxYear = data.degree === "B.Tech" ? 4 : data.degree === "M.Tech" ? 2 : 3;
            if (data.currentYear > maxYear) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Current year cannot exceed ${maxYear} for ${data.degree}`,
                    path: ["currentYear"],
                });
            }
        }
        
        if (data.isGraduated === true && (!data.graduationYear || data.graduationYear === null)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Graduation year is required when marked as graduated",
                path: ["graduationYear"],
            });
        }
    }
    
    // Professional validation
    if (data.userType === "professional") {
        if (data.experience === undefined || data.experience === null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Experience is required for professionals",
                path: ["experience"],
            });
        }
    }
});

export const contactSchema = z.object({
    email: z.string().email("Invalid email"),
    mobile: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
});

export const entrySchema = z.object({
    title: z.string().min(1, "Title is required"),
    organization: z.string().min(1, "Company is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().optional(),
    current: z.boolean().default(false),
})
.refine(
    (data) => {
        if(!data.current && !data.endDate) {
            return false;
        }
        return true;
    },
    {
        message: "End date is required if current is false",
        path: ["endDate"],
    }
);

export const resumeSchema = z.object({
    contact: contactSchema,
    summary: z.string().min(1, "Professional summary is required"),
    skills: z.string().min(1, "Skills are required"),
    experience: z.array(entrySchema),
    education: z.array(entrySchema),
    projects: z.array(entrySchema),
});

export const resumeTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
});

export const coverLetterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
});
