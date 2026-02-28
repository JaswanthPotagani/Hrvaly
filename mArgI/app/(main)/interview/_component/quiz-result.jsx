"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Trophy, XCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";

const QuizResult = ({ result, hideStartNew = false, onStartNew }) => {
  
  useEffect(() => {
    if (result?.quizScore > 70) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const random = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [result]);

  if (!result) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-title flex items-center justify-center gap-3">
          <Trophy className="h-10 w-10 text-yellow-500" />
          Performance Analysis
        </h1>
        <p className="text-muted-foreground text-lg">
          Here is how you performed in your {result.category === "HR" ? "behavioral" : "technical"} assessment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-lg">
          <div className="relative w-40 h-40 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
               <circle
                 cx="80"
                 cy="80"
                 r="70"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="12"
                 className="text-muted"
               />
               <motion.circle
                 cx="80"
                 cy="80"
                 r="70"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="12"
                 strokeDasharray="440"
                 strokeDashoffset={440 - (440 * result.quizScore) / 100}
                 className="text-primary"
                 initial={{ strokeDashoffset: 440 }}
                 animate={{ strokeDashoffset: 440 - (440 * result.quizScore) / 100 }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
               />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center flex-col">
               <span className="text-4xl font-bold">{result.quizScore.toFixed(0)}%</span>
               <span className="text-xs text-muted-foreground uppercase">Score</span>
             </div>
          </div>
        </div>

        {/* Learnability Card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10">
              <TrendingUp className="h-20 w-20 text-green-500" />
           </div>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * (result.learnabilityScore || 50)) / 100}
                  className="text-green-500"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * (result.learnabilityScore || 50)) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-green-600">{(result.learnabilityScore || 50).toFixed(0)}%</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Learnability</span>
              </div>
           </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center space-y-4 shadow-lg">
           <div className="flex justify-between items-center border-b border-border/50 pb-2">
             <span className="text-muted-foreground">Total Questions</span>
             <span className="font-bold">{result.questions.length}</span>
           </div>
           {result.category === "HR" ? (
             <div className="flex justify-between items-center pb-2">
               <span className="text-muted-foreground">Response Quality</span>
               <span className="font-bold text-primary">Qualitative</span>
             </div>
           ) : (
             <>
               <div className="flex justify-between items-center border-b border-border/50 pb-2">
                 <span className="text-muted-foreground">Correct Answers</span>
                 <span className="font-bold text-green-500">{result.questions.filter(q => q.isCorrect).length}</span>
               </div>
               <div className="flex justify-between items-center pb-2">
                 <span className="text-muted-foreground">Incorrect Answers</span>
                 <span className="font-bold text-red-500">{result.questions.filter(q => !q.isCorrect).length}</span>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Improvement Tip */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center shadow-lg">
         <h3 className="font-bold mb-2 flex items-center gap-2">
           <span>💡</span> Improvement Tip
         </h3>
         <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
           {result.improvementTip || "Great job! Keep practicing to maintain your skills."}
         </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-xl">Question Review</h3>
        <div className="grid gap-4">
          {result.questions.map((q, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-lg">{q.question}</p>
                {q.isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className={`p-3 rounded-lg ${q.isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                   <p className="font-medium text-muted-foreground mb-1">Your Answer</p>
                   <p className={q.isCorrect ? "text-primary" : "text-red-600"}>{q.userAnswer}</p>
                </div>
                {(result.category === "HR" || !q.isCorrect) && (
                   <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                     <p className="font-medium text-muted-foreground mb-1">{result.category === "HR" ? "Ideal Sample Response" : "Correct Answer"}</p>
                     <p className="text-green-600">{q.answer}</p>
                   </div>
                )}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-border/50 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Explanation</p>
                <p className="text-foreground/80">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default QuizResult;
