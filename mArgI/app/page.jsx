"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Trophy, Briefcase, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { features } from "./data/features";
import { howItWorks } from "./data/howItWorks";
import { faqs } from "./data/faqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";


export default function Home() {
  return (
    <div className="relative overflow-hidden pt-16">
      
      {/* --- HERO SECTION --- */}
      {/* --- HERO SECTION --- */}
      <HeroGeometric>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium shadow-[0_0_20px_rgba(249,115,22,0.3)] backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Career Acceleration</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-white drop-shadow-lg">
              Master Your Placement with the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-300 to-orange-500 animate-gradient-x">
                Ultimate AI Interview Prep & <br/> ATS Resume Checker
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Build a bot-beating resume, master AI mock interviews, and get placed 10x faster with the power of artificial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  Start For Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
      </HeroGeometric>

      {/* --- STATS STRIP --- */}
      <section className="py-6 md:py-8 border-y border-white/5 bg-white/5 backdrop-blur-sm mt-12 md:mt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 md:gap-8 text-center divide-x divide-white/10">
            {[
              { label: "Industries", value: "50+" },
              { label: "Interview Qs", value: "1000+" },
              { label: "AI Support", value: "24/7" }
            ].map((stat, i) => (
              <div key={i} className="px-2 md:px-4">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Powerful Tools</h2>
            <p className="text-muted-foreground text-lg">Everything you need to land your dream job, powered by advanced AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                <div className="relative z-10 h-full flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed flex-grow">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Sticky Scroll) --- */}
      <section className="py-32 bg-black/20 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Five simple steps to your new career.</p>
          </div>
          
          <div className="max-w-5xl mx-auto space-y-24">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7 }}
                className="group text-center max-w-2xl mx-auto space-y-6"
              >
                <div className="inline-block p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-[0_0_15px_rgba(249,115,22,0.2)] group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-4xl font-bold">
                  <span className="text-primary/50 mr-4 text-6xl align-top opacity-30 select-none group-hover:opacity-60 transition-opacity duration-300">0{index + 1}</span>
                  <br className="md:hidden"/>
                  {item.title}
                </h3>
                <p className="text-xl text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 bg-white/5 px-6 rounded-2xl hover:bg-white/10 transition-colors">
                <AccordionTrigger className="text-lg font-medium py-6 hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="py-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-orange-900 to-black px-6 py-24 text-center border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250px_250px] animate-pulse"/>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Ready to launch your career?</h2>
              <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto">Join thousands of professionals using AI to master their interviews and land their dream jobs.</p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="h-16 px-12 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-xl">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
