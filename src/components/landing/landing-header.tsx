'use client'

import { ArrowRight, ExternalLink, Github, Star, Users } from 'lucide-react';
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button';
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function Header() {
    const { isSignedIn, isLoaded } = useUser()
    const router = useRouter()

    // GitHub Stars Hook with better error handling

    // Discord Community Button

    const handleGetStarted = () => {
      if (!isLoaded) return
      
      if (isSignedIn) {
        router.push('/projects')
      } else {
        router.push('/sign-in')
      }
    }

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 overflow-hidden">
      {/* Liquid Glass Effect Layer */}
      <div className="absolute inset-0 bg-background/75 backdrop-blur-md" />
      
      {/* Enhanced glass morphism with edge effects */}
      <div className="absolute inset-0">
        {/* Main glass surface */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.02] dark:from-white/[0.02] dark:via-transparent dark:to-white/[0.01]" />
        
        {/* Subtle edge highlight - top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        
        {/* Edge glow effects */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-blue-400/8 to-transparent" />
        
        {/* Bottom border enhancement */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Logo with enhanced effects */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative group">
                {/* Enhanced glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10"> 
                  <Image src="/logo.png" alt="Logo" width={40} height={40} />
                </div>
              </div>
              {/* Enhanced gradient text with new font */}
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent tracking-tight">
                Refobe
              </span>
            </div>

            {/* Center - Enhanced Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group">
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
              {/* <Link 
                href="/docs" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors relative group"
              >
                Docs
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
              </Link> */}
            </nav>

            {/* Right side - GitHub, Discord + Auth buttons */}
            <div className="flex items-center space-x-3">
           
              
              <div className="w-px h-6 bg-border/40 mx-2" />
              
              <Button 
                size="sm" 
                className="hidden sm:inline-flex group relative overflow-hidden font-medium bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer border-0 shadow-lg shadow-blue-600/25 dark:shadow-blue-400/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={handleGetStarted}
                disabled={!isLoaded}
              >
                <span className="relative z-10">
                  {!isLoaded ? 'Loading...' : isSignedIn ? 'Go to Projects' : 'Get Started'}
                </span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform relative z-10" />
                {/* Enhanced shimmer effect with dark mode support */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header