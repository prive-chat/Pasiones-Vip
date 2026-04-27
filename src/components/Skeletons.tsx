import React from 'react';
import { Card, CardContent } from './ui/Card';

export const MediaSkeleton = () => (
  <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden bg-[#0A0A0A] border border-white/5 shadow-2xl relative">
        {/* Shimmer Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full" />
        </div>
        
        <div className="aspect-[4/5] w-full bg-white/[0.02]" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-white/[0.05]" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded-lg bg-white/[0.05]" />
                <div className="h-3 w-20 rounded-lg bg-white/[0.02]" />
              </div>
            </div>
            <div className="h-10 w-20 rounded-xl bg-white/[0.05]" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded-lg bg-white/[0.05]" />
            <div className="h-4 w-2/3 rounded-lg bg-white/[0.05]" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen pb-20 bg-[#050505]">
    <div className="h-64 w-full bg-gradient-to-b from-white/[0.05] to-transparent md:h-80" />
    <div className="container mx-auto max-w-5xl px-4">
      <div className="relative -mt-32 mb-12 flex flex-col items-center md:flex-row md:items-end md:space-x-8">
        <div className="h-48 w-48 rounded-full border-4 border-[#050505] bg-white/[0.05] shadow-2xl" />
        <div className="mt-8 flex-1 text-center md:mt-0 md:pb-6 md:text-left space-y-6">
          <div className="h-12 w-80 rounded-2xl bg-white/[0.05] mx-auto md:mx-0" />
          <div className="h-6 w-40 rounded-xl bg-white/[0.03] mx-auto md:mx-0" />
          <div className="flex gap-3 justify-center md:justify-start">
             <div className="h-5 w-24 rounded-full bg-white/[0.02]" />
             <div className="h-5 w-24 rounded-full bg-white/[0.02]" />
          </div>
        </div>
        <div className="mt-8 flex space-x-4 md:mt-0 md:pb-6">
          <div className="h-14 w-40 rounded-2xl bg-white/[0.05]" />
          <div className="h-14 w-14 rounded-2xl bg-white/[0.05]" />
        </div>
      </div>
      <div className="mb-12 h-px bg-white/[0.05]" />
      <div className="space-y-12">
        <div className="h-10 w-64 rounded-2xl bg-white/[0.05]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-white/[0.02] border border-white/5" />
           ))}
        </div>
      </div>
    </div>
  </div>
);
