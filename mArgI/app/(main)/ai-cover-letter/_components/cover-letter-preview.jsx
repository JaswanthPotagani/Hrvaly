"use client";

import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const CoverLetterPreview = ({ content }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-4 space-y-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="px-4 py-2 bg-muted/30 rounded-full border border-primary/10 text-sm text-muted-foreground flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             AI Generated Content
          </div>

          <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={handleCopy}
                className="gap-2 border-primary/20 hover:border-primary text-foreground hover:bg-primary/10 transition-all"
            >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Text"}
            </Button>
          </div>
      </div>

      {/* Document/Paper Effect */}
      <div className="bg-card border border-border/50 rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-sm">
         {/* Subtle pattern or texture could go here */}
         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full -mr-12 -mt-12 pointer-events-none"></div>

         <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <MDEditor.Markdown 
                source={content} 
                className="bg-transparent"
                style={{ 
                    backgroundColor: 'transparent', 
                    color: 'inherit',
                    fontFamily: 'inherit'
                }} 
            />
         </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;