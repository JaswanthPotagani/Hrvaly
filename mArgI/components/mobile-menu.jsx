"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import { FileText, GraduationCap, LayoutDashboard, Menu, PenBox, Briefcase, Mic, Mail, Instagram, Headset, FolderClock, MessageCircle } from 'lucide-react'

export const MobileMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className='h-6 w-6' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href='/dashboard' className='flex items-center gap-2 cursor-pointer'>
            <LayoutDashboard className='h-4 w-4 text-primary animate-pulse'/>
            <span>Market Pulse</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/interview' className='flex items-center gap-2 cursor-pointer'>
             <GraduationCap className='h-4 w-4 text-primary animate-pulse'/>
             <span>AI Interview Preparation</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/voice-interview' className='flex items-center gap-2 cursor-pointer'>
             <Mic className='h-4 w-4 text-primary animate-pulse'/>
             <span>AI Voice Interview</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/resume' className='flex items-center gap-2 cursor-pointer'>
             <FileText className='h-4 w-4 text-primary animate-pulse'/>
             <span>ATS Resume Builder</span>
          </Link>
        </DropdownMenuItem>
         <DropdownMenuItem asChild>
          <Link href='/ai-cover-letter' className='flex items-center gap-2 cursor-pointer'>
             <PenBox className='h-4 w-4 text-primary animate-pulse'/>
             <span>Cover Letter</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/jobs' className='flex items-center gap-2 cursor-pointer'>
            <Briefcase className='h-4 w-4 text-primary animate-pulse'/>
            <span>Recommended Jobs</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href='/applications' className='flex items-center gap-2 cursor-pointer'>
             <FolderClock className='h-4 w-4 text-primary animate-pulse'/>
             <span>My Applications</span>
          </Link>
        </DropdownMenuItem>

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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
