import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Quiz from "../_component/quiz";

const MockInterviewPage = () => {
  return (
    <div className="min-h-screen flex flex-col gap-6 py-6 container mx-auto px-4">
      <Link href="/interview">
        <Button variant="link" className="gap-2 pl-0 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Interview Preparation
        </Button>
      </Link>

      <div className="flex-1">
        <Quiz />
      </div>
    </div>
  );
};

export default MockInterviewPage;