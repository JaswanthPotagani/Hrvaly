"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="w-full pt-24 sm:pt-32 md:pt-40 pb-12 sm:pb-16 md:pb-20 px-4 overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        
        {/* Centered Content */}
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 z-10">
          
          {/* New Feature Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-fadeInUp">
            <Sparkles className="w-4 h-4" />
            <span>New: AI Resume Analysis</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight animate-fadeInUp delay-100">
            Professional <br/>
            <span className="gradient-title pr-4">Intelligence</span> <br/>
            for Your Career
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto animate-fadeInUp delay-200">
            Unlock your full potential with AI-powered career guidance, personalized interview prep, and industry insights tailored just for you.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto animate-fadeInUp delay-300">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-primary/20 transition-all">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
