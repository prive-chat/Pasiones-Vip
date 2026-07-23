import React from 'react';
import { motion } from 'framer-motion';
import officialLogo from '../../assets/images/logo_official_1782583829112.jpg';

interface LogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Pasiones Vip - Official Brand Logo
 * Symbolizes luxury, elite companionship, and maximum security/privacy.
 */
export const Logo: React.FC<LogoProps> = ({ className = "", size = 64, glow = true }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-passion-red via-amber-500 to-passion-red blur-[24px] rounded-full opacity-60"
        />
      )}
      <div className="relative z-10 rounded-2xl overflow-hidden border border-amber-500/30 p-[2px] bg-zinc-950 shadow-[0_0_20px_rgba(230,0,0,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:border-amber-500/60" style={{ width: size, height: size }}>
        <img
          src={officialLogo}
          alt="Pasiones VIP Official Logo"
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover rounded-[14px]"
        />
      </div>
    </div>
  );
};
