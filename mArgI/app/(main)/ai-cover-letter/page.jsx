import { getCoverLetters, getUserCoverLetterStats } from "@/actions/cover-letter";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/cover-letter-list";
import AddCoverLetter, { AddCoverLetterMobile } from "./_components/add-cover-letter";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();
  const stats = await getUserCoverLetterStats();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-8">
        <h1 className="text-4xl md:text-6xl font-bold gradient-title">
          My Cover Letters
        </h1>
        <div className="flex gap-2">
            <AddCoverLetter canCreate={stats.canCreate} />
            <AddCoverLetterMobile canCreate={stats.canCreate} />
        </div>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}