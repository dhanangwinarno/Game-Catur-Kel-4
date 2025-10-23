import React from 'react';
import { CellState } from '../types';
import Card from './Card';

interface CellProps {
  cellState: CellState;
  onClick: () => void;
  isHighlighted: boolean;
  id: string;
  isChanged: boolean;
}

const Cell: React.FC<CellProps> = ({ cellState, onClick, isHighlighted, id, isChanged }) => {
  const baseClasses = 'w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-md';
  const highlightClasses = isHighlighted 
    ? 'bg-yellow-300/70 cursor-pointer ring-2 ring-yellow-400' 
    : 'bg-slate-700/50';
  const transitionClasses = 'transition-all duration-200';
  const animationClasses = isChanged ? 'animate-state-change' : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`${baseClasses} ${highlightClasses} ${transitionClasses} ${animationClasses}`}
    >
      {cellState ? (
        <Card 
            value={cellState.value} 
            color={cellState.color}
            isPlaced={true}
        />
      ) : (
        isHighlighted && <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default Cell;