import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { Story } from '@/src/services/storyService';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const story = stories[currentIndex];

  const DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      {/* Background Blur */}
      <div className="absolute inset-0 opacity-40 blur-3xl scale-150 pointer-events-none">
        <img src={story.media_url} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative w-full max-w-lg aspect-[9/16] bg-zinc-950 shadow-2xl rounded-none md:rounded-[3rem] overflow-hidden flex flex-col">
        {/* Top Progress Bars */}
        <div className="absolute top-4 inset-x-4 flex gap-1 z-20">
          {stories.map((_, idx) => (
            <div key={idx} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ 
                  width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-8 inset-x-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-primary-500 overflow-hidden bg-zinc-900">
              <OptimizedImage src={story.profiles?.avatar_url || ''} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white italic truncate max-w-[120px]">
                  {story.profiles?.full_name}
                </span>
                {story.profiles?.is_verified && <BadgeCheck size={14} className="text-primary-500" />}
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hace 2h</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden md:flex absolute inset-y-0 -left-20 items-center z-20">
          <button onClick={handlePrev} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-0" disabled={currentIndex === 0}>
            <ChevronLeft size={32} />
          </button>
        </div>
        <div className="hidden md:flex absolute inset-y-0 -right-20 items-center z-20">
          <button onClick={handleNext} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              {story.media_type === 'video' ? (
                <video 
                  src={story.media_url} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  muted 
                  playsInline
                  onEnded={handleNext}
                />
              ) : (
                <img src={story.media_url} alt="" className="w-full h-full object-cover" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
