"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutTemplate, Loader2, Sparkles, Check, FileText, Blocks, Briefcase, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "professional",
    name: "Professional",
    description: "Traditional, clean layout. ATS-friendly & safe for all industries.",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column design with accent colors and skills focus.",
    icon: Blocks,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Emphasis on summary, leadership, and quantifiable results.",
    icon: Briefcase,
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "minimal",
    name: "Minimalist",
    description: "High density text, no column breaks. Maximum content space.",
    icon: Minus,
    color: "bg-slate-100 text-slate-600",
  },
];

export function ResumeTemplateSelector({ isOpen, onOpenChange, onSelect, isCreating }) {
  const [selectedId, setSelectedId] = useState("professional");

  const handleConfirm = () => {
    onSelect(selectedId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            Select Resume Template
          </DialogTitle>
          <DialogDescription>
             Choose a structure for your new AI-optimized resume. You can always change the content later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {TEMPLATES.map((template) => {
            const isSelected = selectedId === template.id;
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 hover:bg-muted/50",
                  isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                     <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                <div className="flex gap-4 items-start">
                   <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", template.color)}>
                      <Icon className="h-5 w-5" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="font-semibold leading-none">{template.name}</h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                         {template.description}
                      </p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleConfirm} disabled={isCreating} className="gap-2 min-w-[140px]">
              {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
              ) : (
                  <>
                     <Sparkles className="h-4 w-4" />
                     Create Resume
                  </>
              )}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
