"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit2, Eye, Trash2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCoverLetter } from "@/actions/cover-letter";
import { motion, AnimatePresence } from "framer-motion";

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  if (!coverLetters?.length) {
    return (
      <Card className="bg-muted/20 border border-primary/10 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center py-10">
          <CardTitle className="text-2xl font-bold text-foreground">No Cover Letters Yet</CardTitle>
          <CardDescription className="text-lg text-muted-foreground/80">
            Create your first AI-powered cover letter to stand out!
          </CardDescription>
          <Button 
            onClick={() => router.push("/ai-cover-letter/new")}
            variant="outline" 
            className="mt-4 mx-auto w-fit border-primary/50 text-primary hover:bg-primary/10"
          >
            Create Your First Letter
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {coverLetters.map((letter, index) => (
          <motion.div
            key={letter.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            layout
          >
            <Card className="group relative h-full flex flex-col justify-between bg-card/40 backdrop-blur-xl border border-primary/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden">
              
              {/* Decorative gradient blob */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>

              <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-orange-400 transition-all duration-300 truncate pr-4">
                      {letter.jobTitle}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">
                      {letter.companyName}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-4 flex-grow">
                <div className="flex items-center text-xs text-muted-foreground/80 gap-2 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>Created {format(new Date(letter.createdAt), "PPP")}</span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed border-l-2 border-primary/20 pl-3">
                  {letter.jobDescription}
                </p>
              </CardContent>

              <div className="p-4 pt-0 mt-auto relative z-10 flex justify-between items-center gap-2 border-t border-border/10 pt-4 bg-muted/5">
                 <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-medium">View Details</span>
                  </Button>


              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}