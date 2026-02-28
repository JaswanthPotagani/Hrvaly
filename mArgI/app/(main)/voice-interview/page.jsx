"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Zap, GraduationCap, ChevronRight, Volume2, ShieldAlert, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import useFetch from "@/app/hooks/use-fetch";
import { startVoiceInterview, generateVoiceResponse, saveVoiceAssessment, getVoiceAssessments } from "@/actions/interview";
import { getUserData } from "@/actions/user";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StatsCard from "../interview/_component/stats-cards";
import PerformanceChart from "../interview/_component/performance-chart";
import VoiceHistory from "./_components/voice-history";
import { PLAN_LIMITS } from "@/lib/pricing";

export default function VoiceInterviewPage() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [allAssessments, setAllAssessments] = useState([]);
  const [user, setUser] = useState(null);
  const [isPremiumRequired, setIsPremiumRequired] = useState(false);
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const [startInterviewFn, startData, starting, startError] = useFetch(startVoiceInterview);
  const [generateTurnFn, turnData, processing, turnError] = useFetch(generateVoiceResponse);

  // Fetch voice assessments and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [assessments, userData] = await Promise.all([
          getVoiceAssessments(),
          getUserData()
        ]);
        setAllAssessments(assessments);
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const speak = (text) => {
    if (!synthRef.current) return;
    
    // Stop any current speaking
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US"; // Force US English
    
    // Select a natural sounding US voice if available
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => 
        (v.lang === "en-US" && (v.name.includes("Google") || v.name.includes("Natural")))
      ) || voices.find(v => v.lang === "en-US") || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    synthRef.current.speak(utterance);
  };

  const handleUserResponse = useCallback(async (text = "") => {
    if (processing || isSpeaking) return;
    
    // Prevent empty submissions
    if (!text && !transcript) {
        toast.warning("Please provide an answer before proceeding.");
        return;
    }

    const responseText = text || transcript;
    
    const data = await generateTurnFn(history, responseText);
    if (data?.text) {
      setAiMessage(data.text);
      setHistory(data.history);
      setTranscript("");

      // Check for JSON result in the message
      const jsonMatch = data.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const rawText = data.text;
          const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          let resultData;
          try {
            resultData = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
             // Attempt to fix common AI mistakes like raw control characters in strings
             const fixedJson = jsonMatch[0].replace(/"((?:\\.|[^"\\])*)"/g, (match, p1) => {
               return '"' + p1
                 .replace(/\n/g, "\\n")
                 .replace(/\r/g, "\\r")
                 .replace(/\t/g, "\\t")
                 .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                 + '"';
             });
             resultData = JSON.parse(fixedJson);
          }

          if (resultData.type === "RESULT") {
            setResults(resultData);
            setIsFinished(true);
            
            // Save to database with inputHash for caching
            saveVoiceAssessment(resultData, data.inputHash).catch(err => console.error("Auto-save failed", err));

            // We still speak the text part before showing results
            const spokenText = data.text.replace(jsonMatch[0], "").trim();
            speak(spokenText);
            return;
          }
        } catch (e) {
            console.error("Failed to parse result JSON", e);
        }
      }

      speak(data.text);
    }
  }, [processing, isSpeaking, transcript, history, generateTurnFn]);

  // Start the interview
  const handleStart = async () => {
    try {
      const data = await startInterviewFn();
      if (data?.text) {
        setIsStarted(true);
        setAiMessage(data.text);
        setHistory(data.history);
        speak(data.text);
      }
    } catch (err) {
      console.error("Start Interview Error:", err);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript;
          setTranscript(text);
          setIsListening(false);
          handleUserResponse(text);
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'no-speech') return;

          if (event.error === 'network') {
             toast.error("Network error: Your browser's speech recognition service is unreachable. Check your internet or try another browser (Chrome/Edge).", {
               duration: 6000,
             });
          } else {
             toast.error("Speech recognition error: " + event.error);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
      synthRef.current = window.speechSynthesis;
    }
  }, [handleUserResponse]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (isFinished && results) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold gradient-title">Interview Complete!</h1>
          <p className="text-muted-foreground text-xl">Here is your performance summary</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="h-20 w-20 text-primary" />
               </div>
               <CardHeader>
                 <CardTitle className="text-lg font-medium">Overall Score</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="text-7xl font-black text-primary">{results.score}%</div>
                  <p className="mt-4 text-sm text-muted-foreground text-center">Technical & communication depth.</p>
               </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingUp className="h-20 w-20 text-green-500" />
               </div>
               <CardHeader>
                 <CardTitle className="text-lg font-medium">Learnability Index</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center justify-center py-6">
                  <div className="text-7xl font-black text-green-600">{results.learnabilityScore || 50}%</div>
                  <p className="mt-4 text-sm text-muted-foreground text-center">Rate of improvement from previous rounds.</p>
               </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-primary/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-medium">AI Coaching Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-secondary/30 p-4 rounded-xl space-y-1">
                       <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Grammar & Clarity</h4>
                       <p className="text-sm leading-relaxed">{results.grammar}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl space-y-1">
                       <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confidence Level</h4>
                       <p className="text-sm leading-relaxed">{results.confidence}</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                       <Zap className="h-4 w-4 text-primary" /> Actionable Tips
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                       {results.tips.map((tip, i) => (
                          <li key={i} className="text-sm flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                             {tip}
                          </li>
                       ))}
                    </ul>
                 </div>
              </CardContent>
           </Card>
        </div>

        <Card className="border-primary/10 shadow-lg">
           <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                 <GraduationCap className="h-6 w-6 text-primary" /> Ideal Responses
              </CardTitle>
              <CardDescription>Review what a perfect answer for each question would look like.</CardDescription>
           </CardHeader>
           <CardContent>
              <div className="space-y-6">
                 {results.questions.map((item, i) => (
                    <div key={i} className="space-y-3 p-6 rounded-2xl bg-secondary/10 border border-primary/5 hover:border-primary/20 transition-colors">
                       <h4 className="font-bold text-lg flex gap-3 text-primary/90">
                          <span className="opacity-50">Q{i+1}.</span>
                          {item.q}
                       </h4>
                       <div className="bg-background/80 p-4 rounded-xl border border-primary/5">
                          <p className="text-sm leading-relaxed text-muted-foreground italic">
                            &quot;{item.ideal}&quot;
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        <div className="flex justify-center pt-8">
           <Button 
            size="lg" 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="px-12 py-6 text-lg hover:bg-primary/5 border-primary/20 gap-2"
           >
              Try Another Round
           </Button>
        </div>
      </div>
    );
  }

  if (isPremiumRequired || isLimitExceeded) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center">
        <Card className="max-w-md w-full border-primary/20 shadow-2xl bg-primary/5">
          <CardContent className="py-12 flex flex-col items-center text-center space-y-6">
            <div className="bg-primary/10 p-5 rounded-full ring-8 ring-primary/5">
              <Zap className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">
                {isLimitExceeded ? "Monthly Limit Reached" : "Pro Feature Only"}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isLimitExceeded 
                  ? "You have completed your 4 mock interview rounds for this month. Upgrade or wait for the next cycle to continue practicing." 
                  : "AI Voice Interviews are exclusive to Placement Pro users. Experience realistic 5-question mock rounds with detailed coaching (4 rounds per month)."}
              </p>
            </div>
            {isPremiumRequired ? (
              <Link href="/dashboard" className="w-full">
                <Button size="lg" className="w-full group gap-2 shadow-lg hover:shadow-primary/20 transition-all font-bold">
                  Upgrade to Pro <Zap className="h-4 w-4 fill-current group-hover:scale-125 transition-transform" />
                </Button>
              </Link>
            ) : (
                <Link href="/dashboard" className="w-full">
                   <Button variant="outline" className="w-full">
                      Back to Dashboard
                   </Button>
                </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded-lg opacity-50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[...Array(3)].map((_, i) => (
             <Card key={i} className="animate-pulse">
                <CardContent className="h-32 bg-muted/20" />
             </Card>
           ))}
        </div>
        <Card className="h-64 animate-pulse bg-muted/10" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-title flex items-center gap-3">
            <Mic className="h-8 w-8 text-primary" /> AI Voice Interview
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Standard mock interview but hands-free. Talk to our AI coach.
          </p>
        </div>
        {isStarted && (
           <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              Reset Session
           </Button>
        )}
      </div>

      {!isStarted ? (
        <div className="space-y-12">
          {/* Stats Section */}
          <StatsCard assessments={allAssessments} />

          {/* Performance Chart Section */}
          <PerformanceChart assessments={allAssessments} />

          <div className="grid gap-8 md:grid-cols-3">
             {/* Left Column: Recent Assessments */}
             <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold">Recent Voice Assessments</h2>
                </div>
                <VoiceHistory assessments={allAssessments} />
             </div>

             {/* Right Column: Start New & Info */}
             <div className="space-y-6">
                <Card className="bg-primary/5 border-dashed border-2 border-primary/20 hover:bg-primary/10 transition-all group cursor-pointer" onClick={handleStart}>
                   <CardContent className="py-10 flex flex-col items-center text-center space-y-4">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                         <Mic className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">Start New Session</h3>
                      <p className="text-sm text-muted-foreground px-4">
                        Ready to practice? Start a new AI-guided 5-question round.
                      </p>
                      <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                        Begin Now <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1" />
                      </Button>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2">
                         {user?.plan === "PREMIUM" ? `(${user?.monthlyUsage?.voiceInterview || 0}/4 Used This Month)` : "PRO FEATURE: 4 ROUNDS / MONTH"}
                      </p>
                   </CardContent>
                </Card>

                <Card className="bg-secondary/10 border-primary/5">
                   <CardHeader>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">How it works</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {[
                        { icon: Volume2, title: "Listen", desc: "AI asks difficult career questions." },
                        { icon: Mic, title: "Speak", desc: "Respond naturally with your voice." },
                        { icon: Zap, title: "Review", desc: "Get detailed coaching results." }
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4 items-start">
                           <step.icon className="h-5 w-5 text-primary shrink-0 mt-1" />
                           <div>
                              <p className="text-sm font-bold">{step.title}</p>
                              <p className="text-xs text-muted-foreground">{step.desc}</p>
                           </div>
                        </div>
                      ))}
                   </CardContent>
                </Card>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card className="min-h-[400px] flex flex-col justify-between overflow-hidden border-primary/20 shadow-2xl relative">
             {/* Dynamic Visualizer Overlay */}
             {(isListening || isSpeaking) && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-center justify-center -z-0 opacity-50">
                    <div className="flex gap-1 items-end h-20">
                       {[...Array(12)].map((_, i) => (
                          <motion.div 
                             key={i}
                             animate={{ height: [20, 80, 20] }}
                             transition={{ repeat: Infinity, duration: 0.5 + Math.random(), delay: i * 0.1 }}
                             className="w-2 bg-primary/40 rounded-full"
                          />
                       ))}
                    </div>
                </div>
             )}

            <CardHeader className="border-b bg-muted/30 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-green-500 animate-pulse" : "bg-muted"}`} />
                  {isSpeaking ? "AI is Speaking..." : isListening ? "Listening to you..." : processing ? "AI is Thinking..." : "Waiting..."}
                </CardTitle>
                <div className="text-xs opacity-50">
                   Turn {Math.floor((history.length - 2) / 2) + 1} / 5
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={aiMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-2xl"
                >
                  <p className="text-2xl md:text-3xl font-medium leading-tight">
                    {aiMessage}
                  </p>
                </motion.div>
              </AnimatePresence>

              {transcript && (
                 <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="italic text-lg text-primary"
                  >
                   &quot;{transcript}...&quot;
                 </motion.p>
              )}
            </CardContent>

            <div className="p-8 border-t bg-muted/10 flex justify-center items-center gap-6 relative z-10">
               <Button 
                size="icon" 
                variant={isListening ? "destructive" : "primary"}
                className={`h-20 w-20 rounded-full shadow-2xl transition-all ${isListening ? "scale-110" : "hover:scale-105"}`}
                onClick={toggleListening}
                disabled={isSpeaking || processing}
               >
                 {isListening ? <MicOff className="h-10 w-10" /> : processing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Mic className="h-10 w-10" />}
               </Button>

               {/* Manual Proceed Button */}
               <Button 
                 variant="outline" 
                 size="lg"
                 className="h-14 px-6 rounded-xl border-primary/20 hover:bg-primary/5 gap-2 group"
                 onClick={() => handleUserResponse(transcript || "(User clicked proceed/next)")}
                 disabled={isSpeaking || processing || isListening}
               >
                 Next Question <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </Button>
            </div>
          </Card>

          <div className="flex flex-col gap-2 px-4 shadow-sm">
             <p className="text-[10px] text-muted-foreground/50 italic">
               * Best experienced on Chrome or Edge. Speech recognition may vary by browser and network stability.
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
