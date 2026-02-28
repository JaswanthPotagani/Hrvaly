"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useState } from "react";
import { CheckCircle2, Mic } from "lucide-react";

const VoiceHistory = ({ assessments }) => {
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((assessment) => (
          <Card
            key={assessment.id}
            className="cursor-pointer hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:border-primary/50 border-primary/10 bg-card/40 backdrop-blur-sm group"
            onClick={() => setSelectedAssessment(assessment)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  Voice Round
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
                <p className="line-clamp-2 italic">
                   {assessment.improvementTip?.split('\n')[0] || "Performance analyzed."}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-title">
              Voice Interview Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssessment && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                     <p className="text-xs text-muted-foreground uppercase font-bold">Score</p>
                     <p className="text-3xl font-black text-primary">{selectedAssessment.quizScore}%</p>
                  </div>
                  <div className="md:col-span-2 p-4 bg-secondary/20 rounded-xl border border-border/50 text-left">
                     <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Feedback Summary</p>
                     <p className="text-sm italic text-muted-foreground leading-relaxed">
                        {selectedAssessment.improvementTip}
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                 <h4 className="font-bold text-lg border-b pb-2">Questions & Model Responses</h4>
                 <div className="space-y-4">
                    {selectedAssessment.questions?.map((item, i) => (
                       <div key={i} className="p-4 rounded-lg bg-muted/30 space-y-2 border border-border/50">
                          <p className="font-bold text-sm text-primary">Q{i+1}: {item.q}</p>
                          <div className="bg-background/50 p-3 rounded border border-primary/5">
                            <p className="text-xs italic text-muted-foreground leading-relaxed">&quot;{item.ideal}&quot;</p>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceHistory;
