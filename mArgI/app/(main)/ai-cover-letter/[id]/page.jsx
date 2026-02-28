import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCoverLetter } from "@/actions/cover-letter";
import CoverLetterPreview from "../_components/cover-letter-preview";

export const dynamic = "force-dynamic";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="container mx-auto py-6 min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-8">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0 text-muted-foreground hover:text-primary transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>
        
        <div>
           <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-2">
            {coverLetter?.jobTitle || "Cover Letter"}
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
             at <span className="text-foreground">{coverLetter?.companyName}</span>
          </p>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="flex-grow">
          {/* We pass the styling responsibility to CoverLetterPreview or wrap it here if we want a specific page background effect. 
              Reviewing the plan: "Professional document resting on a cyber-themed stage".
              The CoverLetterPreview likely handles the markdown rendering. Let's ensure the container here provides the 'stage'.
          */}
          <div className="relative">
             {/* Background glow effects for the 'stage' */}
             <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

             <CoverLetterPreview content={coverLetter?.content} />
          </div>
      </div>
    </div>
  );
}