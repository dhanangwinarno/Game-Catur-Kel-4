import React, { useEffect } from 'react';
import { playSound } from '../services/audioService';

// Using a fixed number of confetti pieces for the effect
const CONFETTI_COUNT = 150;

/**
 * A component that renders a confetti animation.
 * It's displayed when a player wins the game.
 */
const Confetti: React.FC = () => {
  useEffect(() => {
    playSound('confetti');
  }, []); // Play sound once on mount

  // Generate an array of confetti pieces with random styles for a varied look
  const confettiPieces = Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
    const style: React.CSSProperties = {
      // Random horizontal position
      left: `${Math.random() * 100}vw`,
      // Random animation duration for a staggered effect
      animationDuration: `${Math.random() * 3 + 2}s`, // from 2s to 5s
      // Random delay to start falling at different times
      animationDelay: `${Math.random() * 2}s`,
      // Random HSL color for a rainbow effect
      backgroundColor: `hsl(${Math.random() * 360}, 100%, 65%)`,
      // Initial random rotation
      transform: `rotate(${Math.random() * 360}deg)`,
    };
    return <div key={i} className="confetti-piece" style={style} />;
  });

  return <div className="confetti-container" aria-hidden="true">{confettiPieces}</div>;
};

export default Confetti;