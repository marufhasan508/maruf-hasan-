
import React from 'react';
import { motion } from 'framer-motion';

interface RobotProps {
  isListening: boolean;
  isSpeaking: boolean;
}

const Robot: React.FC<RobotProps> = ({ isListening, isSpeaking }) => {
  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.2, 1] : 1,
          opacity: isListening ? [0.2, 0.4, 0.2] : 0.1,
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-blue-400 rounded-full blur-3xl"
      />

      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        {/* Head */}
        <path
          d="M60 100 C60 60 140 60 140 100 L140 140 C140 160 60 160 60 140 Z"
          fill="#fff"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        
        {/* Face Shield */}
        <rect x="75" y="85" width="50" height="35" rx="10" fill="#f1f5f9" />

        {/* Eyes */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.45, 0.5, 0.55, 1] }}
        >
          <circle cx="85" cy="100" r="4" fill={isListening ? "#3b82f6" : "#64748b"} />
          <circle cx="115" cy="100" r="4" fill={isListening ? "#3b82f6" : "#64748b"} />
        </motion.g>

        {/* Speaking Visualization */}
        {isSpeaking && (
          <motion.rect
            x="90" y="115" width="20" height="2" rx="1"
            fill="#3b82f6"
            animate={{ scaleX: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
          />
        )}

        {/* Ears/Antennas */}
        <circle cx="60" cy="100" r="6" fill="#e2e8f0" />
        <circle cx="140" cy="100" r="6" fill="#e2e8f0" />
        
        {/* Top Antenna */}
        <line x1="100" y1="70" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="3" />
        <motion.circle
          cx="100" cy="50" r="4"
          fill={isListening ? "#3b82f6" : "#cbd5e1"}
          animate={isListening ? { scale: [1, 1.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
        />
      </motion.svg>
    </div>
  );
};

export default Robot;
