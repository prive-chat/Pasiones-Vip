import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * Pasiones Vip - "Enclave VIP" Logo
 * Symbolizes secure communication through interlocking chat bubbles 
 * that form a lock in negative space.
 */
export const Logo: React.FC<LogoProps> = ({ className = "", size = 64, glow = true }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-passion-red/20 blur-[30px] rounded-full text-passion-red"
        />
      )}
      <img
        src="/icon.png?v=logo-v2"
        alt="Pasiones VIP Logo"
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="relative z-10 object-contain drop-shadow-[0_0_15px_rgba(230,0,0,0.4)] transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
