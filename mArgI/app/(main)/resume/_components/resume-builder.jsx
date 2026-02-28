"use client";

import { updateResume, improvedWithAI } from "@/actions/resume";
import useFetch from "@/app/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Save, Loader2, Sparkles, Edit, Monitor, AlertTriangle, Eye, EyeOff, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { resumeSchema } from "@/lib/validations";
import EntryForm from "./entry-form";
import { toast } from "sonner";
import { entriesToMarkdown } from "@/app/lib/helper";
import MDEditor from "@uiw/react-md-editor";

import { motion, AnimatePresence } from "framer-motion";
import ResumeScore from "./resume-score";
import DOMPurify from "dompurify";

const ResumeBuilder = ({ initialContent, resumeId, initialTitle, isReadOnly, user, selectedTemplate }) => {
    // Mobile tab state: "edit" or "preview"
    const [activeTab, setActiveTab] = useState("edit");
    const [previewContent, setPreviewContent] = useState(initialContent);
    // const { user } = useUser(); // Removed hook
    const [isGenerating, setIsGenerating] = useState(false);
    const [resumeScore, setResumeScore] = useState(initialContent?.atsScore);
    const [atsResult, setAtsResult] = useState(null);
    const [planLimitReached, setPlanLimitReached] = useState(isReadOnly); // Initialize with isReadOnly

    const { control, handleSubmit, register, watch, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {},
            summary: "",
            skills: "",
            experience: [],
            education: [],
            projects: [],
        },
    });

    const [saveResumeFn, saveResult, isSaving, saveError] = useFetch(updateResume);
    const [improveWithAIFn, improvedContent, isImproving, improveError] = useFetch(improvedWithAI);

    useEffect(() => {
        if (isReadOnly) {
            setPlanLimitReached(true);
        }
    }, [isReadOnly]);

    useEffect(() => {
        if (improvedContent && !isImproving) {
            setValue("summary", improvedContent);
            toast.success("Summary improved successfully");
        }

        if (improveError) {
            toast.error(improveError.message || "Failed to improve summary");
        }
    }, [improvedContent, isImproving, improveError, setValue]);

    const formValues = watch();

    useEffect(() => {
        if (initialContent) {
            // No strict tab setting needed here as we want valid default state
        }
    }, [initialContent]);

    // Update preview content when form changes
    useEffect(() => {
        const newContent = getCombinedContent();
        setPreviewContent(newContent ? newContent : initialContent);
    }, [formValues, getCombinedContent, initialContent]);

    const getContactMarkdown = useCallback(() => {
        const { contactInfo } = formValues;
        const parts = [];
        if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
        if (contactInfo.mobile) parts.push(`Mobile: ${contactInfo.mobile}`);
        if (contactInfo.linkedin) parts.push(`LinkedIn: ${contactInfo.linkedin}`);
        if (contactInfo.github) parts.push(`GitHub: ${contactInfo.github}`);

        // Template specific Heading
        switch (selectedTemplate) {
            case 'modern':
                return `## <div align="left">${user?.name}</div>
                \n\n<div align="left">\n\n${parts.join(" | ")} \n\n</div><hr/>`;
            case 'executive':
                return `## <div align="center" style="text-transform:uppercase; letter-spacing:2px;">${user?.name}</div>
                \n\n<div align="center" style="border-bottom: 2px solid #333; padding-bottom:10px;">\n\n${parts.join(" • ")} \n\n</div>`;
            case 'minimalist':
                 return `### ${user?.name}
                 \n${parts.join(" | ")}`;
            case 'professional':
            default:
                return `## <div align="center">${user?.name} </div>
                \n\n<div align="center">\n\n${parts.join(" | ")} \n\n </div>`;
        }
    }, [formValues, selectedTemplate, user]);

    const getCombinedContent = useCallback(() => {
        const { summary, skills, experience, education, projects } = formValues;
        
        // Helper to format sections based on template
        const formatSection = (title, content) => {
            if (!content) return null;
            switch(selectedTemplate) {
                case 'modern':
                     return `### <div style="border-left: 4px solid #3b82f6; padding-left: 10px;">${title}</div>\n\n${content}`;
                case 'executive':
                     return `### <div style="text-transform:uppercase; border-bottom: 1px solid #000;">${title}</div>\n\n${content}`;
                case 'minimalist':
                     return `#### ${title}\n\n${content}`;
                default: 
                     return `## ${title}\n\n${content}`;
            }
        };

        return [
            getContactMarkdown(),
            formatSection("Professional Summary", summary),
            formatSection("Skills", skills),
            entriesToMarkdown(experience, "Work Experience"),
            entriesToMarkdown(education, "Education"),
            entriesToMarkdown(projects, "Projects"),
        ]
            .filter(Boolean)
            .join("\n\n");
    }, [getContactMarkdown, formValues, selectedTemplate]);

    useEffect(() => {
        if (saveResult && !isSaving) {
            toast.success("Resume saved successfully");
        }
        if (saveError) {
            if (saveError.message === "PLAN_LIMIT_EXCEEDED") {
                setPlanLimitReached(true);
            }
            toast.error(saveError.message || "Failed to save resume");
        }
    }, [saveResult, isSaving, saveError]);

    const onSubmit = async () => {
        try {
            const result = await saveResumeFn(resumeId, previewContent, initialTitle);
            if (result?.atsScore) {
                setResumeScore(result.atsScore);
                setAtsResult({
                    atsScore: result.atsScore,
                    keywordScore: result.keywordScore || 0, // Handle optional keywordScore
                    feedback: result.feedback
                });
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Convert markdown to HTML
            const htmlContent = previewContent
                ?.replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br/>')
                || '';

            // Sanitize HTML to prevent XSS
            const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
                ADD_ATTR: ['target', 'align'], // Allow some specific attributes if needed for templates
            });

            // Create print window
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.error("Please allow popups to download PDF");
                return;
            }

            printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        @media print {
            @page {
                margin: 15mm;
            }
            
            /* Remove browser default headers and footers */
            body {
                padding: 0;
                margin: 0;
            }
            
            /* Hide default browser print headers/footers */
            header, footer {
                display: none !important;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: #000 !important;
            background: #fff !important;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            background: #fff;
            padding: 20px;
        }
        
        h2 {
            font-size: 18pt;
            font-weight: bold;
            margin: 15pt 0 8pt 0;
            border-bottom: 2px solid #000;
            padding-bottom: 4pt;
            page-break-after: avoid;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 12pt 0 6pt 0;
            page-break-after: avoid;
        }
        
        p {
            margin: 6pt 0;
        }
        
        strong {
            font-weight: bold;
        }
        
        em {
            font-style: italic;
        }
    </style>
</head>
<body>
    ${sanitizedHtml}
    <script>
        window.onload = function() {
            // Set print options to remove headers/footers
            setTimeout(function() {
                window.print();
                setTimeout(function() {
                    window.close();
                }, 100);
            }, 100);
        };
    </script>
</body>
</html>
           `);

            printWindow.document.close();

            toast.success("Print dialog opened! In print settings, disable 'Headers and footers' option, then save as PDF.");
        } catch (error) {
            console.error("Failed to generate resume", error);
            toast.error("Failed to open print dialog: " + (error.message || "Unknown error"));
        } finally {
            setIsGenerating(false);
        }
    };

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground relative pb-24 md:pb-0">
            {/* Left Column: Form Section */}
            <motion.div
                className={`w-full md:w-1/2 p-6 md:p-10 space-y-8 overflow-y-auto md:h-screen ${activeTab === 'preview' ? 'hidden md:block' : 'block'}`}
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div>
                    <h1 className="font-bold gradient-title text-5xl md:text-6xl mb-2">Resume Builder</h1>
                    <p className="text-muted-foreground">Craft your professional story.</p>
                </div>

                {/* Form Components */}
                <form className="space-y-8">
                    {planLimitReached && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Plan Limit Reached</AlertTitle>
                            <AlertDescription>
                                You have reached your resume update limit. Please upgrade your plan to continue saving and downloading edits.
                            </AlertDescription>
                        </Alert>
                    )}
                    {/* Contact Info */}
                    <motion.div variants={fadeInUp} className="space-y-4 bg-muted/30 border border-primary/5 hover:border-primary/40 transition-all rounded-xl p-6 backdrop-blur-sm shadow-sm group">
                        <h3 className="text-xl font-semibold text-primary/80 group-hover:text-primary transition-colors">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input disabled={isReadOnly} {...register("contactInfo.email")}
                                    type="email"
                                    placeholder="Enter your email"
                                    error={errors.contactInfo?.email}
                                    className="bg-background/50"
                                />
                                {errors.contactInfo?.email && (
                                    <p className="text-red-500 text-sm">{errors.contactInfo.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mobile Number</label>
                                <Input disabled={isReadOnly} {...register("contactInfo.mobile")}
                                    type="tel"
                                    placeholder="Enter your mobile number"
                                    className="bg-background/50"
                                />
                                {errors.contactInfo?.mobile && (
                                    <p className="text-red-500 text-sm">{errors.contactInfo.mobile.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">LinkedIn URL</label>
                                <Input disabled={isReadOnly} {...register("contactInfo.linkedin")}
                                    type="url"
                                    placeholder="Enter your LinkedIn URL"
                                    className="bg-background/50"
                                />
                                {errors.contactInfo?.linkedin && (
                                    <p className="text-red-500 text-sm">{errors.contactInfo.linkedin.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">GitHub URL</label>
                                <Input disabled={isReadOnly} {...register("contactInfo.github")}
                                    type="url"
                                    placeholder="Enter your GitHub URL"
                                    className="bg-background/50"
                                />
                                {errors.contactInfo?.github && (
                                    <p className="text-red-500 text-sm">{errors.contactInfo.github.message}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary */}
                    <motion.div variants={fadeInUp} className="space-y-4 bg-muted/30 border border-primary/5 hover:border-primary/40 transition-all rounded-xl p-6 backdrop-blur-sm shadow-sm group">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-primary/80 group-hover:text-primary transition-colors">Professional Summary</h3>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                    const summary = watch("summary");
                                    if (!summary) {
                                        toast.error("Please enter a summary first");
                                        return;
                                    }
                                    await improveWithAIFn({
                                        current: summary,
                                        type: "professional summary",
                                    });
                                }}
                                disabled={isImproving || !watch("summary") || isReadOnly}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                                {isImproving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4 animate-pulse" />
                                )}
                                <span className="ml-2 hidden sm:inline">Improve with AI</span>
                            </Button>
                        </div>
                        <Controller
                            name="summary"
                            control={control}
                            render={({ field }) => (
                                <Textarea disabled={isReadOnly} {...field}
                                    className="h-32 bg-background/50 resize-y"
                                    placeholder="Enter your professional summary"
                                    error={errors.summary}
                                />
                            )}
                        />
                        {errors.summary && (
                            <p className="text-red-500 text-sm">{errors.summary.message}</p>
                        )}
                    </motion.div>

                    {/* Skills */}
                    <motion.div variants={fadeInUp} className="space-y-4 bg-muted/30 border border-primary/5 hover:border-primary/40 transition-all rounded-xl p-6 backdrop-blur-sm shadow-sm group">
                        <h3 className="text-xl font-semibold text-primary/80 group-hover:text-primary transition-colors">Skills</h3>
                        <Controller
                            name="skills"
                            control={control}
                            render={({ field }) => (
                                <Textarea disabled={isReadOnly} {...field}
                                    className="h-32 bg-background/50 resize-y"
                                    placeholder="Enter your skills"
                                    error={errors.skills}
                                />
                            )}
                        />
                        {errors.skills && (
                            <p className="text-red-500 text-sm">{errors.skills.message}</p>
                        )}
                    </motion.div>

                    {/* Experience, Education, Projects - utilizing EntryForm */}
                    {[
                        { title: "Experience", name: "experience" },
                        { title: "Education", name: "education" },
                        { title: "Projects", name: "projects" }
                    ].map((section, idx) => (
                        <motion.div key={section.name} variants={fadeInUp} className="space-y-4 bg-muted/30 border border-primary/5 hover:border-primary/40 transition-all rounded-xl p-6 backdrop-blur-sm shadow-sm group">
                            <h3 className="text-xl font-semibold text-primary/80 group-hover:text-primary transition-colors">{section.title}</h3>
                            <Controller
                                name={section.name}
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type={section.title}
                                        entries={field.value}
                                        onChange={field.onChange}
                                        disabled={isReadOnly}
                                    />
                                )}
                            />
                            {errors[section.name] && (
                                <p className="text-red-500 text-sm">{errors[section.name].message}</p>
                            )}
                        </motion.div>
                    ))}
                </form>


                {/* Spacer for bottom action bar on mobile */}
                <div className="h-20 md:hidden"></div>
            </motion.div>

            {/* Right Column: Preview Section (Sticky on desktop) */}
            <motion.div
                className={`w-full md:w-1/2 p-4 md:p-10 bg-muted/10 border-l border-border/50 overflow-y-auto md:h-screen md:sticky md:top-0 ${activeTab === 'edit' ? 'hidden md:block' : 'block'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="md:hidden flex items-center gap-2 mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">Edits in preview mode will be lost if you update the form.</span>
                </div>

                <div className="mb-8">
                    {resumeScore !== undefined && resumeScore !== null && (
                        <ResumeScore score={resumeScore} />
                    )}
                </div>

                <div className="relative rounded-xl overflow-hidden ring-1 ring-border/50 shadow-2xl bg-card">
                    <MDEditor
                        value={previewContent}
                        onChange={setPreviewContent}
                        height={800}
                        preview="preview"
                        hideToolbar={false}
                        className="border-none"
                    />
                </div>
                {/* Spacer for bottom action bar on mobile */}
                <div className="h-20 md:hidden"></div>
            </motion.div>

            {/* Floating Action Bar (Bottom) */}
            <motion.div
                className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 p-4"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="container mx-auto flex items-center justify-between">
                    {/* Mobile Toggle */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
                            className="gap-2"
                        >
                            {activeTab === "edit" ? (
                                <>
                                    <Eye className="h-4 w-4" />
                                    Show Preview
                                </>
                            ) : (
                                <>
                                    <Edit className="h-4 w-4" />
                                    Edit Form
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">

                        <Button variant="secondary" onClick={onSubmit} disabled={isSaving || planLimitReached} className="shadow-sm">
                            {isSaving ? (
                                <>
                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                     Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                        <Button onClick={generatePDF} disabled={isGenerating || planLimitReached} className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ATS Score Modal */}
            <Dialog open={!!atsResult} onOpenChange={() => setAtsResult(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-background border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                           <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                           ATS Analysis Result
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Here&apos;s how your resume performs against ATS standards.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {/* Main Score - Radial progress */}
                        <div className="relative flex items-center justify-center">
                             <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                             <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-muted flex items-center justify-center bg-background">
                                <div className="text-center">
                                    <span className="text-3xl sm:text-4xl font-bold text-primary">{atsResult?.atsScore || 0}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground block">/100</span>
                                </div>
                                <svg className="absolute top-0 left-0 h-full w-full -rotate-90">
                                    <circle
                                        cx={window.innerWidth < 640 ? "48" : "60"}
                                        cy={window.innerWidth < 640 ? "48" : "60"}
                                        r={window.innerWidth < 640 ? "46" : "58"}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="text-primary"
                                        strokeDasharray={`${2 * Math.PI * (window.innerWidth < 640 ? 46 : 58)}`}
                                        strokeDashoffset={`${2 * Math.PI * (window.innerWidth < 640 ? 46 : 58) * (1 - (atsResult?.atsScore || 0) / 100)}`}
                                        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                                    />
                                </svg>
                             </div>
                        </div>

                         {/* Keyword Score */}
                         <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm font-medium">
                                <span>Keyword Match</span>
                                <span>{atsResult?.keywordScore || 0}%</span>
                            </div>
                            <Progress value={atsResult?.keywordScore || 0} className="h-2" />
                        </div>

                        {/* Feedback */}
                        {atsResult?.feedback && (
                             <div className="w-full p-3 rounded-lg bg-muted text-xs sm:text-sm text-muted-foreground">
                                <p className="font-medium text-foreground mb-1">Feedback:</p>
                                <p className="leading-relaxed">{atsResult.feedback}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setAtsResult(null)} className="w-full text-sm sm:text-base">
                            Back to Editor
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ResumeBuilder;
