"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { Button } from "./ui/button";

export const MarketPulseButton = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant="outline"
        className="relative overflow-hidden group border-primary/20 hover:border-primary/50 transition-colors duration-300"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <LayoutDashboard className="h-4 w-4 mr-2 text-primary group-hover:animate-pulse" />
        <span className="relative z-10 font-semibold tracking-tight">Market Pulse</span>
        <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </Button>
    </motion.div>
  );
};
