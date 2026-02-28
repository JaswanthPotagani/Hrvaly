"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, SendHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { submitScreening } from "@/actions/screening";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or generic toast

export default function MockInterviewParamsClient({ questions, jobId }) {
    // Chat State
    // Format: { role: 'model' | 'user', content: string }
    // Initial state: Bot asks Question 1
    const [messages, setMessages] = useState([
        { role: 'model', content: `Hello! Let's start your screening. Question 1: ${questions[0]}` }
    ]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 0, 1, 2
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // { passed: boolean, score: number, feedback: string }
    const router = useRouter();
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        // Wait a bit to simulate thinking
        await new Promise(r => setTimeout(r, 600));

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex < questions.length) {
            // Move to next question
            const nextQuestion = questions[nextIndex];
            const botMsg = { role: 'model', content: `Thanks. Question ${nextIndex + 1}: ${nextQuestion}` };
            setMessages(prev => [...prev, botMsg]);
            setCurrentQuestionIndex(nextIndex);
            setIsLoading(false);
        } else {
            // Finished 3 questions
            const botMsg = { role: 'model', content: "Thank you! I am now analyzing your responses..." };
            setMessages(prev => [...prev, botMsg]);
            
            try {
                // Submit full transcript
                const fullTranscript = [...messages, userMsg]; // messages is stale in this closure, using prev logic would be better but this is safe enough if we access state correctly. 
                // Better:
                const latestTranscript = [...messages, userMsg];
                
                const evaluation = await submitScreening(jobId, latestTranscript);
                setResult(evaluation);
                
                if (evaluation.passed) {
                   toast.success("Screening Passed!");
                } else {
                   toast.error("Screening Not Passed.");
                }

            } catch (error) {
                console.error(error);
                toast.error("Something went wrong with submission.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (result) {
        return (
            <div className="p-6 text-center space-y-6">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    {result.passed ? (
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    ) : (
                        <XCircle className="w-10 h-10 text-red-600" />
                    )}
                </div>
                
                <div>
                    <h2 className={`text-2xl font-bold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {result.passed ? "Verified Badge Earned!" : "Screening Not Passed"}
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Score: {result.score}/100
                    </p>
                    {result.feedback && (
                        <div className="bg-muted p-4 rounded mt-4 text-sm text-left">
                            <strong>Feedback:</strong> {result.feedback}
                        </div>
                    )}
                </div>

                {result.passed ? (
                    <Button onClick={() => router.push('/jobs')} className="w-full">
                        Continue to Apply
                    </Button>
                ) : (
                    <Button onClick={() => router.push('/jobs')} variant="outline" className="w-full">
                        Back to Jobs
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px]">
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && (
                                <Avatar className="w-8 h-8 border">
                                    <AvatarFallback>AI</AvatarFallback>
                                    <AvatarImage src="/bot-avatar.png" />
                                </Avatar>
                            )}
                            
                            <div className={`rounded-lg p-3 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {msg.content}
                            </div>
                            
                            {msg.role === 'user' && (
                                <Avatar className="w-8 h-8 border">
                                    <AvatarFallback>ME</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                             <div className="bg-muted rounded-lg p-3 max-w-[80%] text-sm flex items-center">
                                 <span className="animate-pulse">...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>
            
            <div className="p-4 border-t bg-background flex gap-2">
                <Input 
                    placeholder={isLoading ? "Please wait..." : "Type your answer..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
                    <SendHorizontal className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
