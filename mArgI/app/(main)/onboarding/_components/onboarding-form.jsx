"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import useFetch from "@/app/hooks/use-fetch";
import { useEffect } from "react";
import { updateUser } from "@/actions/user";
import { NICHE_MODES } from "@/lib/niche-config";

const OnboardingForm = ({industries}) => {
    const [selectedIndustry,setSelectedIndustry] = useState(null);
    const [userType, setUserType] = useState(null);
    const [isGraduated, setIsGraduated] = useState(false);
    const router = useRouter();

    const [updateUserFn, updateResult, updateLoading] = useFetch(updateUser);
    const { register, handleSubmit, formState: { errors },setValue,watch, } = useForm({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            experience: "",
            currentYear: "",
            graduationYear: "",
            isGraduated: false,
        }
    });

    const onSubmit = async (values) => {
        try {
            const formattedIndustry = `${values.industry}-${values.subIndustry.toLowerCase().replace(/ /g,"-")}`;
            
            const result = await updateUserFn({
               ...values,
               industry:formattedIndustry,
            });

            if (result?.success) {
                toast.success("Profile updated successfully");
                router.push("/dashboard");
                router.refresh();
            } else if (result?.error) {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Onboarding failed",error);
            toast.error("An unexpected error occurred. Please try again.");
        }
    };

    useEffect(() => {
        if(updateResult?.success && !updateLoading){
            toast.success("Profile updated successfully");
            router.push("/dashboard");
            router.refresh();
        }
    },[updateResult,updateLoading, router]);
    
    // Handle submission errors
    useEffect(() => {
        if(updateResult?.error && !updateLoading){
            toast.error(updateResult.error);
        }
    },[updateResult, updateLoading]);
    
    const watchIndustry = watch("industry");
    const watchSubIndustry = watch("subIndustry");
    const watchDegree = watch("degree");
    const watchIsGraduated = watch("isGraduated");
    const watchCurrentYear = watch("currentYear");
    
    // Handle user type change
    const handleUserTypeChange = (value) => {
        setUserType(value);
        setValue("userType", value);
        
        // Reset conditional fields when switching types
        if (value === "student") {
            setValue("experience", "");
            setValue("college", "");
            setValue("branch", "");
            setValue("degree", undefined);
            // Default to false so currentYear field shows by default
            setValue("isGraduated", false);
            setValue("currentYear", "");
            setValue("graduationYear", "");
            setValue("specialization", "");
            setIsGraduated(false);
        } else {
            setValue("college", "");
            setValue("branch", "");
            setValue("degree", undefined);
            setValue("isGraduated", undefined);
            setValue("currentYear", "");
            setValue("graduationYear", "");
            setValue("specialization", "");
            setValue("experience", "");
        }
    };
    
    // Handle graduation status change
    const handleGraduationChange = (checked) => {
        setIsGraduated(checked);
        setValue("isGraduated", checked);
        
        // Clear mutually exclusive fields
        if (checked) {
            // If graduated, clear currentYear
            setValue("currentYear", "");
        } else {
            // If not graduated, clear graduationYear
            setValue("graduationYear", "");
        }
    };
    
    // Handle current year change
    const handleCurrentYearChange = (e) => {
        const value = e.target.value;
        setValue("currentYear", value);
        
        // If a year is selected, uncheck graduated
        if (value) {
            setIsGraduated(false);
            setValue("isGraduated", false);
            setValue("graduationYear", "");
        }
    };
    
    // Get max year based on degree type
    const getMaxYear = () => {
        if (watchDegree === "B.Tech") return 4;
        if (watchDegree === "M.Tech") return 2;
        if (watchDegree === "Degree") return 3;
        return 4;
    };
    
    
    return(
      <div className="flex items-center justify-center px-4">
        <Card className="w-full max-w-lg mt-10 mx-auto">
            <CardHeader>
                <CardTitle className="gradient-title text-4xl">Create your profile</CardTitle>
                <CardDescription>Select your role and provide details to get personalized career insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* User Type Selection */}
                    <div className="space-y-3">
                        <Label>Are you a Student or a Professional?</Label>
                        <RadioGroup onValueChange={handleUserTypeChange} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="student" id="student" />
                                <Label htmlFor="student" className="font-normal cursor-pointer">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="professional" id="professional" />
                                <Label htmlFor="professional" className="font-normal cursor-pointer">Professional</Label>
                            </div>
                        </RadioGroup>
                        {errors.userType && (<p className="text-red-500 text-sm">{errors.userType.message}</p>)}
                    </div>

                    {/* Conditional Fields for Students */}
                    {userType === "student" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="college">College Name *</Label>
                                <Input 
                                    id="college"
                                    placeholder="Enter your college name"
                                    {...register("college")}
                                />
                                {errors.college && (<p className="text-red-500 text-sm">{errors.college.message}</p>)}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="degree">Degree Type *</Label>
                                <Select onValueChange={(value) => setValue("degree", value)}>
                                    <SelectTrigger id="degree">
                                        <SelectValue placeholder="Select your degree" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                                        <SelectItem value="Degree">Degree (B.Sc/B.Com/etc.)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.degree && (<p className="text-red-500 text-sm">{errors.degree.message}</p>)}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch / Department</Label>
                                <Input 
                                    id="branch"
                                    placeholder="e.g., Computer Science, Mechanical, etc."
                                    {...register("branch")}
                                />
                                {errors.branch && (<p className="text-red-500 text-sm">{errors.branch.message}</p>)}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="isGraduated" 
                                    checked={isGraduated}
                                    onCheckedChange={handleGraduationChange}
                                    disabled={watchCurrentYear && watchCurrentYear !== ""}
                                />
                                <Label 
                                    htmlFor="isGraduated" 
                                    className={`font-normal ${watchCurrentYear && watchCurrentYear !== "" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                >
                                    I have graduated
                                </Label>
                            </div>
                            {errors.isGraduated && (<p className="text-red-500 text-sm">{errors.isGraduated.message}</p>)}

                            {/* Conditional Year Input */}
                            {watchIsGraduated !== true && watchDegree && (
                                <div className="space-y-2">
                                    <Label htmlFor="currentYear">Current Year *</Label>
                                    <Input 
                                        id="currentYear"
                                        type="number"
                                        min={1}
                                        max={getMaxYear()}
                                        placeholder={`Enter year (1-${getMaxYear()})`}
                                        {...register("currentYear")}
                                        onChange={handleCurrentYearChange}
                                        disabled={watchIsGraduated === true}
                                    />
                                    {errors.currentYear && (<p className="text-red-500 text-sm">{errors.currentYear.message}</p>)}
                                </div>
                            )}

                            {watchIsGraduated === true && (
                                <div className="space-y-2">
                                    <Label htmlFor="graduationYear">Year of Graduation *</Label>
                                    <Input 
                                        id="graduationYear"
                                        type="number"
                                        min={1950}
                                        max={new Date().getFullYear()}
                                        placeholder="e.g., 2022"
                                        {...register("graduationYear")}
                                    />
                                    {errors.graduationYear && (<p className="text-red-500 text-sm">{errors.graduationYear.message}</p>)}
                                </div>
                            )}
                        </>
                    )}

                    {/* Conditional Experience Field for Professionals */}
                    {userType === "professional" && (
                        <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience *</Label>
                            <Input 
                                id="experience"
                                type="number"
                                min={0}
                                max={50}
                                placeholder="Enter years of experience"
                                {...register("experience")}
                            />
                            {errors.experience && (<p className="text-red-500 text-sm">{errors.experience.message}</p>)}
                        </div>
                    )}

                    {/* Common Fields */}
                    {userType && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="industry">{userType === "student" ? "Target Industry *" : "Industry *"}</Label>
                                <Select
                                  onValueChange={(value) =>{
                                    setValue("industry",value);
                                    setSelectedIndustry(
                                        industries.find((ind) => ind.id === value)
                                    );
                                    setValue("subIndustry","");
                                    setValue("specialization", "");
                                    }}>

                                    <SelectTrigger id="industry">
                                        <SelectValue placeholder="Select an industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries?.map((ind) => (
                                            <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                                        ))}
                                        
                                    </SelectContent>
                                </Select>
                                {errors.industry && (<p className="text-red-500 text-sm">{errors.industry.message}</p>)}
                            </div>

                           { watchIndustry &&  (<div className="space-y-2">
                                 <Label htmlFor="subIndustry">Specialization *</Label>
                                    <Select
                                    onValueChange={(value) => {
                                        setValue("subIndustry",value);
                                        setValue("specialization", "");
                                    }}>

                                        <SelectTrigger id="subIndustry">
                                            <SelectValue placeholder="Select a specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedIndustry?.subIndustries.map((ind) => (
                                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                            ))}
                                            
                                        </SelectContent>
                                    </Select>
                                {errors.subIndustry && (<p className="text-red-500 text-sm">{errors.subIndustry.message}</p>)}
                            </div>)}



                        <div className="space-y-2">
                            <Label htmlFor="location">Country / Location *</Label>
                            <Input 
                            id="location"
                            placeholder="Enter your country/location"
                            {...register("location")}/>      
                            
                            {errors.location && (<p className="text-red-500 text-sm">{errors.location.message}</p>)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills</Label>
                            <Input 
                            id="skills"
                            placeholder="Enter your skills separated by commas"
                            {...register("skills")}/>      
                            
                            {errors.skills && (<p className="text-red-500 text-sm">{errors.skills.message}</p>)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea 
                            id="bio"
                            placeholder="Tell us about yourself"
                            className="h-32"
                            {...register("bio")}/>      
                            
                            {errors.bio && (<p className="text-red-500 text-sm">{errors.bio.message}</p>)}
                        </div>

                        <Button type="submit" className="w-full" disabled={updateLoading}>
                            {updateLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating AI Insights... </> ) : ("Complete Profile")}
                        </Button>
                        </>
                    )}
                </form>
            </CardContent>
        </Card>
       </div>
    )
};

export default OnboardingForm;