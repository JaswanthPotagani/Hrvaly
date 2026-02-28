"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QuizResult from "./quiz-result";
import { CheckCircle2 } from "lucide-react";

import { PLAN_LIMITS } from "@/lib/pricing";

const QuizList = ({ assessments, user }) => {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Check Plan Limits
  const plan = user?.plan || "FREE";
  const limit = PLAN_LIMITS[plan]?.interview || PLAN_LIMITS.FREE.interview;
  const assessmentCount = user?.monthlyUsage?.interview || 0;
  
  const isLimitReached = assessmentCount >= limit;
  const limitText = limit === Infinity ? "Unlimited" : `${assessmentCount}/${limit} Used`;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((assessment, i) => (
          <Card
            key={assessment.id}
            className="cursor-pointer hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:border-primary/50 border-primary/10 bg-card/40 backdrop-blur-sm group"
            onClick={() => setSelectedQuiz(assessment)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {assessment.category || "General"}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(assessment.createdAt), "MMM dd, yyyy")}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl font-bold text-primary">
                  {assessment.quizScore.toFixed(0)}%
                </div>
                <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                   View Details
                </Button>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                <p className="line-clamp-2">
                  {assessment.improvementTip || "No improvement tip available."}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Start New Quiz Card */}
        <Card 
            className={`cursor-pointer hover:bg-muted/50 transition-all duration-300 border-dashed border-2 border-primary/20 bg-muted/10 flex flex-col items-center justify-center min-h-[200px] group ${isLimitReached ? "opacity-50 cursor-not-allowed hover:bg-muted/10" : ""}`}
            onClick={() => {
                if(!isLimitReached) router.push("/interview/mock");
            }}
        >
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold">+</span>
            </div>
            <h3 className="text-lg font-semibold text-primary">Start New Quiz</h3>
            <p className="text-sm text-muted-foreground mt-2">
                ({limitText})
            </p>
            {isLimitReached && (
                <p className="text-xs text-red-500 font-medium mt-1">Plan Limit Reached</p>
            )}
        </Card>
      </div>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-title">
              Quiz Details
            </DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            onStartNew={() => router.push("/interview/mock")}
            hideStartNew
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizList;
