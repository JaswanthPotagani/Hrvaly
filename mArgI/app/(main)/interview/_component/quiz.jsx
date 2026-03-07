"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateQuiz, saveQuizResult, generateAllQuizzes } from "@/actions/interview";
import useFetch from "@/app/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import QuizResult from "./quiz-result";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Code, BookOpen, Users, ChevronRight, Zap, ShieldAlert, Progress } from "lucide-react";
import Link from "next/link";

const INTERVIEW_TYPES = [
  {
    id: "Technical",
    title: "Technical Interview",
    description: "Focus on core fundamentals, industry-specific knowledge, and system design.",
    icon: Brain,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "Aptitude",
    title: "Aptitude Test",
    description: "Focus on logical reasoning, quantitative analysis, and mathematical problem-solving.",
    icon: BookOpen,
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "HR",
    title: "HR Interview",
    description: "Focus on behavioral questions, situational judgment, and culture fit.",
    icon: Users,
    color: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
];

export default function Quiz() {
  const [selectedType, setSelectedType] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [textAnswer, setTextAnswer] = useState("");

  const [streak, setStreak] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0); // In seconds
  const [planLimitReached, setPlanLimitReached] = useState(false);
  
  // Prevent the 404→start infinite loop: track if batch was already triggered
  const generationAttempted = useRef(false);

  const {
    fn: generateQuizFn, 
    data: quizData, 
    loading: generatingQuiz, 
    error: quizError, 
    setData: setQuizData
  } = useFetch(generateQuiz);

  const {
    fn: saveQuizResultFn, 
    data: resultData, 
    loading: savingResult, 
    setData: setResultData
  } = useFetch(saveQuizResult);

  const {
    fn: batchGenerateFn, 
    data: batchData, 
    loading: isBatching, 
    error: batchError
  } = useFetch(generateAllQuizzes);

  // Trigger batch generation ONLY ONCE if pool is empty
  useEffect(() => {
    if (quizData === null && selectedType && !generatingQuiz && !isBatching && !generationAttempted.current) {
      generationAttempted.current = true;
      batchGenerateFn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizData, selectedType]);

  // Once batching is successful, re-fetch the specific quiz
  useEffect(() => {
    if (batchData && selectedType) {
      generateQuizFn(selectedType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchData]);

  useEffect(() => {
    if (quizError) {
      if (quizError.message === "PLAN_LIMIT_EXCEEDED") {
        setPlanLimitReached(true);
      } else if (quizError.message?.includes("404") || quizError.message?.includes("not found")) {
        // Don't show error for 404 - pool not ready yet, batch generation is handling it
        console.log("[Quiz] Pool not ready yet, waiting for generation...");
      } else {
        toast.error(quizError.message || "Failed to load quiz");
      }
    }
  }, [quizError]);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setResultData(null);
      setTextAnswer("");
    }
  }, [quizData, setResultData]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (quizData && !resultData) {
      interval = setInterval(() => {
        setTimeTaken((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizData, resultData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    // Check answer for streak update (moved from handleAnswer)
    if (answers[currentQuestion] === quizData[currentQuestion].correctAnswer) {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTextAnswer("");
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    if (selectedType === "HR") return 100; // HR is qualitative, score 100 for participation
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      const result = await saveQuizResultFn(quizData, answers, score, selectedType);
      if (result) {
        setResultData(result);
      }
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setStreak(0);
    setTimeTaken(0);
    setSelectedType(null);
    setResultData(null);
    setQuizData(null);
  };

  const handleTypeSelect = async (type) => {
    setSelectedType(type);
    generateQuizFn(type);
  };

  if (generatingQuiz || isBatching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <BarLoader className="mt-4" width={"50%"} color="gray" />
        <p className="text-muted-foreground animate-pulse">
          {isBatching 
            ? "AI is preparing all 3 interview rounds for you (Technical, Aptitude, HR)..." 
            : "Loading your questions..."}
        </p>
      </div>
    );
  }

  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-title">Select Interview Type</h1>
          <p className="text-muted-foreground text-lg">
            Choose the focus of your assessment to generate targeted practice questions.
          </p>
        </div>
 
        {planLimitReached && (
          <Card className="bg-primary/5 border-primary/20 shadow-lg animate-in fade-in zoom-in duration-300">
            <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="bg-primary/10 p-5 rounded-full ring-8 ring-primary/5">
                <Zap className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-3xl font-bold">Free Limit Reached</h2>
                <p className="text-muted-foreground">
                  You&apos;ve completed both of your free interviews for this month. 
                  Upgrade to unlock unlimited mock interviews and priority AI feedback.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full group gap-2 shadow-lg hover:shadow-primary/20 transition-all font-bold">
                    Upgrade to Pro <Zap className="h-4 w-4 fill-current group-hover:scale-125 transition-transform" />
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INTERVIEW_TYPES.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTypeSelect(type.id)}
              className="group relative flex flex-col p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:bg-muted/50 transition-all text-left space-y-4 shadow-sm"
            >
              <div className={`p-4 rounded-xl w-fit ${type.color}`}>
                <type.icon className={`h-8 w-8 ${type.iconColor}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {type.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {type.description}
                </p>
              </div>

              <div className="flex items-center text-primary font-medium text-sm pt-4">
                Start Assessment <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-6">
            <p className="text-center text-sm text-muted-foreground">
              Note: Each assessment contains 10 scenario-based questions tailored to your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quizData[currentQuestion];

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Question not found. Please try restarting the quiz.</p>
        <Button onClick={startNewQuiz} className="mt-4">Back to Selection</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 px-4">
      {/* Stats Header */}
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Question</span>
            <span className="font-bold text-xl">{currentQuestion + 1}<span className="text-muted-foreground text-sm">/{quizData.length}</span></span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
             <span className="text-xs text-muted-foreground uppercase tracking-wider">Streak</span>
             <span className="font-bold text-xl flex items-center gap-1">{streak} <span className="text-orange-500">🔥</span></span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
           <span className="text-xs text-muted-foreground uppercase tracking-wider">Time</span>
           <span className="font-mono font-bold text-xl">
             {Math.floor(timeTaken / 60)}:{String(timeTaken % 60).padStart(2, '0')}
           </span>
        </div>
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-xl ring-1 ring-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader>
           <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden mb-4">
             <motion.div 
               className="h-full bg-primary"
               initial={{ width: 0 }}
               animate={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
               transition={{ duration: 0.5 }}
             />
           </div>
          <CardTitle className="text-2xl font-bold leading-relaxed">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.options && question.options.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((option, index) => {
                const isSelected = answers[currentQuestion] === option;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    className={`
                      p-6 rounded-xl text-left transition-all duration-200 border-2
                      ${isSelected 
                        ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold shrink-0
                        ${isSelected ? "border-primary text-primary bg-background" : "border-muted-foreground/30 text-muted-foreground"}
                      `}>
                        {index + 1}
                      </div>
                      <span className={`font-medium text-base break-words w-full ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {option}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
               <Textarea 
                placeholder="Type your response here..."
                value={textAnswer}
                onChange={(e) => {
                  setTextAnswer(e.target.value);
                  handleAnswer(e.target.value);
                }}
                className="min-h-[200px] text-lg p-6 bg-muted/20 border-border focus:border-primary transition-all resize-none"
               />
               <p className="text-sm text-muted-foreground">
                 Professional Tip: Aim for a detailed response using the STAR method (Situation, Task, Action, Result) where applicable.
               </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 border-t border-border/50">
          
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion] || savingResult}
            className="ml-auto gap-2 px-8"
            size="lg"
          >
            {savingResult && (
              <BarLoader className="mt-4" width={"100%"} color="gray" />
            )}
            {currentQuestion < quizData.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}