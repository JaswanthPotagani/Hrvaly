"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";

const UpgradeDialog = ({ isOpen, onOpenChange, title, description }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="bg-primary/10 p-4 rounded-full ring-8 ring-primary/5">
            <Zap className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold">{title || "Limit Reached"}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {description || "You've reached the maximum number of generations for your current plan. Upgrade to Pro for unlimited access and priority features."}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full group gap-2 shadow-lg hover:shadow-primary/20 transition-all font-bold" size="lg">
              Upgrade to Pro <Zap className="h-4 w-4 fill-current group-hover:scale-125 transition-transform" />
            </Button>
          </Link>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
