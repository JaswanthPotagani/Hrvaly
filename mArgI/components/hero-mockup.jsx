"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Bell, 
  Search, 
  Menu,
  Briefcase,
  Award,
  Zap
} from "lucide-react";

export default function HeroMockup() {
  const ref = useRef(null);
  
  // Motion values for tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animation for the tilt
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Transform mouse position to rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full max-w-5xl mx-auto aspect-[16/10] md:aspect-[16/9] perspective-1000"
    >
      {/* Main Dashboard Container */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Bar */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="h-8 bg-white/5 rounded-full border border-white/5 flex items-center px-4 gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <div className="h-2 w-24 bg-white/10 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-16 md:w-64 border-r border-white/10 bg-white/5 hidden md:flex flex-col p-4 gap-2">
            {[
              { icon: <BarChart3 size={20} />, label: "Dashboard", active: true },
              { icon: <Briefcase size={20} />, label: "Interviews" },
              { icon: <Zap size={20} />, label: "AI Coach" },
              { icon: <Award size={20} />, label: "Certificates" },
            ].map((item, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${item.active ? 'bg-primary/20 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-white/5'}`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Main Area */}
          <div className="flex-1 p-6 md:p-8 overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              
              {/* Left Col: Stats */}
              <div className="md:col-span-2 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Welcome back, Alex!</h3>
                    <p className="text-muted-foreground">Your interview prep is on track.</p>
                  </div>
                </div>

                {/* Skill Graph Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Performance Trend
                    </h4>
                  </div>
                  <div className="h-40 flex items-end justify-between gap-2 md:gap-4">
                    {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1, ease: "backOut" }}
                        className="w-full bg-primary/20 rounded-t-sm relative group/bar overflow-hidden"
                      >
                         <div className="absolute bottom-0 left-0 right-0 bg-primary h-full opacity-60 group-hover/bar:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Row */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-2">Mock Interviews</div>
                      <div className="text-2xl font-bold text-white">12</div>
                   </div>
                   <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-2">Questions Solved</div>
                      <div className="text-2xl font-bold text-white">148</div>
                   </div>
                </div>
              </div>

              {/* Right Col: Radial Progress */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-full flex flex-col items-center justify-center relative">
                  <h4 className="font-semibold text-white mb-6 absolute top-6 left-6">Resume Score</h4>
                  
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray="440"
                        strokeDashoffset="440"
                        animate={{ strokeDashoffset: 440 - (440 * 0.85) }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="text-primary"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-white">85</span>
                      <span className="text-xs text-muted-foreground">Excellent</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 w-full space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Keywords</span>
                      <span className="text-green-400">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ delay: 1, duration: 1 }}
                        className="h-full bg-green-400" 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Floating Notifications (Parallax) */}
      <FloatingCard 
        initial={{ x: -20, y: 20, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute -right-8 top-20 bg-black/60 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-2xl z-20 w-64"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="font-bold text-white">Interview Scheduled</div>
            <div className="text-xs text-muted-foreground">Google • Tomorrow, 10 AM</div>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard 
        initial={{ x: 20, y: -20, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute -left-8 bottom-32 bg-black/60 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-2xl z-20 w-56"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="font-bold text-white">Salary Estimate</div>
            <div className="text-xs text-muted-foreground">₹18L - ₹24L / Year</div>
          </div>
        </div>
      </FloatingCard>

    </motion.div>
  );
}

function FloatingCard({ children, className, ...props }) {
  return (
    <motion.div 
      className={className}
      {...props}
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        ...props.transition
      }}
    >
      {children}
    </motion.div>
  );
}
