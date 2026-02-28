"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { ChevronDown, FileText, GraduationCap, PenBox, StarsIcon, Briefcase, Mic, FolderClock } from 'lucide-react'

export const CareerMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <StarsIcon className='h-4 w-4 mr-2'/>
          <span>Career Tools</span>
          <ChevronDown className='h-4 w-4 ml-2'/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href={'/interview'} className='flex items-center gap-2 cursor-pointer'>
            <GraduationCap className='h-4 w-4 text-primary animate-pulse'/>
            <span>AI Interview Preparation</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/voice-interview'} className='flex items-center gap-2 cursor-pointer font-medium'>
            <Mic className='h-4 w-4 text-primary animate-pulse'/>
            <span>AI Voice Interview</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold ml-auto uppercase tracking-tighter">Pro</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/resume'} className='flex items-center gap-2 cursor-pointer'>
            <FileText className='h-4 w-4 text-primary animate-pulse'/>
            <span>ATS Resume Builder</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/ai-cover-letter'} className='flex items-center gap-2 cursor-pointer'>
            <PenBox className='h-4 w-4 text-primary animate-pulse'/>
            <span>Cover Letter</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={'/jobs'} className='flex items-center gap-2 cursor-pointer'>
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
