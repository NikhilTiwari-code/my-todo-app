"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full relative overflow-auto bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-indigo-950/20">
      {/* Animated gradient background mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top gradient orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Radial gradient vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/40 dark:to-black/40" />
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Scrollable container */}
      <div className="relative z-10 flex items-start justify-center px-4 py-8 min-h-screen">
        <Card className="w-full max-w-md my-auto bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-purple-100/50 dark:border-purple-900/50 shadow-2xl shadow-purple-500/10">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
