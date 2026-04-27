import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Pasiones Vip - "Enclave Privé" Logo
 * Symbolizes secure communication through interlocking chat bubbles 
 * that form a lock in negative space.
 */
export const Logo: React.FC<LogoProps> = ({ className = "", size = 64, glow = true }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glow && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-passion-red/20 blur-[60px] rounded-full text-passion-red"
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_0_30px_rgba(198,40,40,0.4)]"
      >
        <defs>
          {/* Main Crimson Crystal Base */}
          <linearGradient id="logo_red_grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4D4D" />
            <stop offset="30%" stopColor="#C62828" />
            <stop offset="70%" stopColor="#8B0000" />
            <stop offset="100%" stopColor="#4A0000" />
          </linearGradient>
          
          {/* Internal Specular Highlight (The 'Crystal' look) */}
          <linearGradient id="crystal_shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="20%" stopColor="white" stopOpacity="0" />
            <stop offset="80%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.5" />
          </linearGradient>

          {/* Depth Glow */}
          <filter id="internal_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Bevel Shadow */}
          <filter id="bevel" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset dx="-2" dy="-2" in="SourceAlpha" result="offset-1" />
            <feGaussianBlur stdDeviation="3" in="offset-1" result="blur-1" />
            <feComposite operator="out" in="SourceAlpha" in2="blur-1" result="highlight" />
            <feFlood floodColor="white" floodOpacity="0.5" result="color-1" />
            <feComposite operator="in" in="color-1" in2="highlight" result="white-highlight" />
            
            <feOffset dx="2" dy="2" in="SourceAlpha" result="offset-2" />
            <feGaussianBlur stdDeviation="3" in="offset-2" result="blur-2" />
            <feComposite operator="out" in="SourceAlpha" in2="blur-2" result="shadow" />
            <feFlood floodColor="black" floodOpacity="0.8" result="color-2" />
            <feComposite operator="in" in="color-2" in2="shadow" result="black-shadow" />
            
            <feMerge>
              <feMergeNode in="black-shadow" />
              <feMergeNode in="white-highlight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Frame with Bevel and Crystal Depth */}
        <g filter="url(#bevel)">
          <path
            d="M90 120C90 103.431 103.431 90 120 90H392C408.569 90 422 103.431 422 120V320C422 336.569 408.569 350 392 350H230L130 422V350H120C103.431 350 90 336.569 90 320V120Z"
            stroke="url(#logo_red_grad)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          
          {/* Secondary Internal Stroke for Detail */}
          <path
            d="M115 135C115 126.716 121.716 120 130 120H382C390.284 120 397 126.716 397 135V305C397 313.284 390.284 320 382 320H240L150 380V320H130C121.716 320 115 313.284 115 305V135Z"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Monogram with Specular Shine */}
        <g filter="url(#internal_glow)">
          {/* P Crystal */}
          <path
            d="M185 300V180H235C255 180 275 195 275 220C275 245 255 260 235 260H185"
            stroke="url(#logo_red_grad)"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* V Crystal */}
          <path
            d="M280 180L320 300L360 180"
            stroke="url(#logo_red_grad)"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Specular Overlays for Monogram - Subtle Gleam */}
          <path
            d="M195 190V230"
            stroke="white"
            strokeOpacity="0.4"
            strokeWidth="4"
            strokeLinecap="round"
            className="mix-blend-overlay"
          />
        </g>

        {/* Ambient Top Shine Reflection */}
        <path
          d="M120 100C114.477 100 110 104.477 110 110H402C402 104.477 397.523 100 392 100H120Z"
          fill="white"
          fillOpacity="0.3"
          className="blur-[2px]"
        />
      </svg>
    </div>
  );
};
