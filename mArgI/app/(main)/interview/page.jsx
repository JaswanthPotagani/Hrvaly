import { getAssessments } from "@/actions/interview";
import { getUserOnboardingStatus } from "@/actions/user"; // Need a way to get user, reusing existng or creating new
import StatsCard from "./_component/stats-cards";
import QuizList from "./_component/quiz-list";
import PerformanceChart from "./_component/performance-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Lightbulb, MessageCircle } from "lucide-react";
import { checkUser } from "@/lib/checkUser";

const InterviewPage = async () => {
  const assessments = await getAssessments();
  const user = await checkUser(); // Assuming checkUser returns the current user from DB


  return (
    <div className="container mx-auto space-y-8 py-8 pb-32">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl md:text-6xl font-bold gradient-title leading-tight">
          Interview Mastery
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your progress, review past performance, and master the art of the interview.
        </p>
      </div>

      {/* Stats Section */}
      <StatsCard assessments={assessments} />

      {/* Performance Chart Section */}
      <div className="mb-8">
        <PerformanceChart assessments={assessments} />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Recent Assessments */}
        <div className="md:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Assessments</h2>
           </div>
           <QuizList assessments={assessments} user={user} />
        </div>

        {/* Right Column: Preparation Guides */}
        <div className="md:col-span-1 space-y-6">
           <h2 className="text-2xl font-bold">Preparation Guides</h2>
           <div className="space-y-4">
              <GuideCard 
                title="The STAR Method" 
                description="Master behavioral questions with Situation, Task, Action, Result."
                icon={<BookOpen className="w-5 h-5 text-primary" />}
              />
              <GuideCard 
                title="Body Language" 
                description="Tips for maintaining confidence and engagement during video calls."
                icon={<Lightbulb className="w-5 h-5 text-yellow-500" />}
              />
              <GuideCard 
                title="Common Questions" 
                description="Prepare for 'Tell me about yourself' and other classics."
                icon={<MessageCircle className="w-5 h-5 text-blue-500" />}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

function GuideCard({ title, description, icon }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/10">
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

export default InterviewPage;