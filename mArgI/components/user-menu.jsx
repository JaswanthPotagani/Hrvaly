"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Instagram, Headset, MessageCircle } from "lucide-react";
import { signOut } from "next-auth/react";

export const UserMenu = ({ user }) => {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a href="mailto:margiaihelp@gmail.com" className="flex items-center cursor-pointer">
            <Mail className="mr-2 h-4 w-4" />
            <span>margiaihelp@gmail.com</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://www.instagram.com/margi.live?igsh=MWhpMHI5Y3R0a2xoaQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
            <Instagram className="mr-2 h-4 w-4" />
            <span>Instagram Page</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://discord.gg/G5WtefEQ" target="_blank" rel="noopener noreferrer" className="flex items-center cursor-pointer">
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>Join Discord</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
