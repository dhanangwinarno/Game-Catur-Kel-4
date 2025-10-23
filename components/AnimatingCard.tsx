import React from 'react';
import { Card as CardType, PlayerColor } from '../types';
import Card from './Card';

interface AnimatingCardProps {
  card: CardType;
  color: PlayerColor;
  fromRect: DOMRect;
  toRect: DOMRect;
  animationDuration: number;
}

const AnimatingCard: React.FC<AnimatingCardProps> = ({ card, color, fromRect, toRect, animationDuration }) => {
  // Use a unique name for the keyframes to avoid conflicts on re-renders
  const animationName = `move-card-${Date.now()}`;
  
  // Calculate the change in position for the transform property for a smoother animation
  const deltaX = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
  const deltaY = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);

  const keyframes = `
    @keyframes ${animationName} {
      from {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0.5;
      }
      to {
        transform: translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1);
        opacity: 1;
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          position: 'fixed',
          zIndex: 100,
          // Set initial position based on the center of the 'from' element
          top: `${fromRect.top + fromRect.height / 2}px`,
          left: `${fromRect.left + fromRect.width / 2}px`,
          // Set size to the final dimensions of the cell's card
          width: `${toRect.width}px`,
          height: `${toRect.height}px`,
          animation: `${animationName} ${animationDuration}ms ease-out forwards`,
        }}
      >
        <Card value={card.value} color={color} isPlaced={true} />
      </div>
    </>
  );
};

export default AnimatingCard;