import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterGenerator from "../_components/cover-letter-generator";

export const dynamic = "force-dynamic";

export default function NewCoverLetterPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 mb-8">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0 text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold gradient-title">
            Cover Letter Studio
          </h1>
          <p className="text-muted-foreground text-lg">
           AI-powered customization to craft your perfect pitch.
          </p>
        </div>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}