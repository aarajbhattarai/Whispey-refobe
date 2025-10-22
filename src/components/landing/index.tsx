"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { motion } from "motion/react"
import React from "react"
import { useState, useEffect } from "react"
import Header from "./landing-header"

export default function LandingPage() {
  // FlipWords for the hero heading  
  const words = [
    { text: "precision", className: "text-purple-500 dark:text-purple-400" },
    { text: "confidence", className: "text-emerald-500 dark:text-emerald-400" },
    { text: "clarity", className: "text-orange-500 dark:text-orange-400" },
    { text: "intelligence", className: "text-cyan-500 dark:text-cyan-400" },
    { text: "Refobe", className: "text-blue-500 dark:text-blue-400" }
  ];

  return (
    <>
      {/* Page-specific font loading - Cabinet Grotesk */}
      <style jsx global>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,600,700,800&display=swap');
        
        .whispey-landing-font {
          font-family: 'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-background whispey-landing-font">

        {/* Enhanced Header */}
        <Header />


        {/* Footer */}
        <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Refobe. All rights reserved.</p>
          </div>
        </footer >
      </div >
    </>
  )
}