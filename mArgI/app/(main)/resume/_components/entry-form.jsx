"use client";

import { improvedWithAI } from "@/actions/resume";
import useFetch from "@/app/hooks/use-fetch";
import { entrySchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse } from "date-fns";

import { Loader2, PlusCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";


const formatDisplayDate = (dateString) => {
    if(!dateString) return "";
    const date = parse(dateString, "yyyy-MM", new Date());
    return format(date, "MMM yyyy");
};

const getFieldLabels = (type) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType === 'education') {
        return {
            title: 'Degree/Qualification',
            organization: 'University/Institution',
            description: 'Highlights, GPA, or Coursework',
            current: 'Currently Studying'
        };
    } else if (lowerType === 'projects') {
        return {
            title: 'Project Name',
            organization: 'Organization/Company',
            description: 'Project Description',
            current: 'Ongoing Project'
        };
    } else {
        return {
            title: 'Title/Position',
            organization: 'Organization/Company',
            description: 'Description of your work',
            current: 'Current Position'
        };
    }
};


const EntryForm = ({type, entries, onChange, disabled}) => {
    const [isAdding, setIsAdding] = useState(false);
    const labels = getFieldLabels(type);

    const {
        register,
        handleSubmit: handleValidation,
        formState:{errors},
        reset,
        watch,
        setValue,
    } = useForm({
        resolver: zodResolver(entrySchema),
        defaultValues: {
            title: "",
            organization: "",
            startDate: "",
            endDate: "",
            description: "",
            current: false,
        },
    });

    const current = watch("current");

    const [improveWithAIFn, improvedContent, isImproving, improveError] = useFetch(improvedWithAI);

    const handleDelete = (index)=> {
        const newEntries = entries.filter((_,i) => i !== index);
        onChange(newEntries);

    }

    const handleAdd = handleValidation((data)=> {

        const formattedEntry = {
            ...data,
            startDate: formatDisplayDate(data.startDate),
            endDate: data.current ? "" : formatDisplayDate(data.endDate),
        };

        onChange([...entries, formattedEntry]);
        reset();
        setIsAdding(false);
    });

    useEffect(() => {
        if(improvedContent && !isImproving){
            setValue("description", improvedContent);
            toast.success("Description improved successfully");
        }

        if(improveError){
            toast.error(improveError.message || "Failed to improve description");
        }
    }, [improvedContent, isImproving, improveError, setValue])
    
    const handleImproveDescription= async ()=> {
        const description = watch("description");
        if(!description){
            toast.error("Please enter a description");
            return;
        }

        await improveWithAIFn({
            current:description,
            type: type.toLowerCase(),
        });
    };
    
    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {entries.map((item, index)=> (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {type.toLowerCase() === 'education' 
                                    ? `${item.title}, ${item.organization}`
                                    : `${item.title} @ ${item.organization}`}
                            </CardTitle>
                        {!disabled && (
                            <Button variant="outline" size="icon" type="button" onClick={()=> handleDelete(index)}>
                                <X className="h-4 w-4"/>
                            </Button>
                        )}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{item.current ? `${item.startDate} - Present` : `${item.startDate} - ${item.endDate}`}</p>
                            <p className="mt-2 text-sm whitespace-pre-wrap">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}

            </div>
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add {type}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input disabled={disabled} placeholder={labels.title} {...register("title")} error={errors.title}/> 
                                {errors.title && (
                                    <p className="text-red-500 text-sm">
                                        {errors.title.message}
                                    </p>
                                )}
                            </div>

                             <div className="space-y-2">
                                <Input disabled={disabled} placeholder={labels.organization} {...register("organization")} error={errors.organization}/> 
                                {errors.organization && (
                                    <p className="text-red-500 text-sm">
                                        {errors.organization.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input disabled={disabled} type="month" {...register("startDate")} error={errors.startDate}/>
                                {errors.startDate && (
                                    <p className="text-red-500 text-sm">
                                        {errors.startDate.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Input type="month" {...register("endDate")} disabled={disabled || current} error={errors.endDate}/>
                                {errors.endDate && (
                                    <p className="text-red-500 text-sm">
                                        {errors.endDate.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input disabled={disabled} type="checkbox" id="current" {...register("current")}
                             onChange={(e) => {
                                setValue("current", e.target.checked);
                                if(e.target.checked){
                                    setValue("endDate", "");
                                }
                             }}
                            />
                            <label htmlFor="current">{labels.current}</label>
                        </div>

                        <div className="space-y-2">
                            <Textarea disabled={disabled} placeholder={labels.description} className="h-32" {...register("description")} error={errors.description}/>
                            {errors.description && (
                                <p className="text-red-500 text-sm">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleImproveDescription}
                            disabled={isImproving || !watch("description") || disabled}
                        >
                            {isImproving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    Improving...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2"/>
                                    Improve with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Button
                         type="button"
                         variant="outline"
                         onClick={() => {setIsAdding(false); reset()}}
                         >
                            Cancel
                        </Button>
                        <Button
                         type="button"
                         onClick={handleAdd}
                         disabled={disabled}
                         >
                            <PlusCircle className="h-4 w-4 mr-2"/>
                            Add Entry
                        </Button>
                    </CardFooter>
                </Card>
            )}

           {!isAdding && (
            <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            >
                <PlusCircle className="h-4 w-4 mr-2"/>
                Add {type}
            </Button>
            
           )}

        </div>
    
    );
};

export default EntryForm;