import React, { useMemo } from 'react';
import { GameState } from '../types';
import Cell from './Cell';
import { getValidMoves } from '../services/gameLogic';

interface BoardProps {
    gameState: GameState;
    onPlaceCard: (x: number, y: number) => void;
    changedCells: Set<string>;
}

const Board: React.FC<BoardProps> = ({ gameState, onPlaceCard, changedCells }) => {
    const { board, selectedCard } = gameState;
    
    // This is now extremely fast because getValidMoves is just an accessor.
    // It will only re-render when a card is selected or the valid moves change (on turn change).
    const validMoves = useMemo(() => {
        if (!selectedCard) return [];
        return getValidMoves(gameState);
    }, [selectedCard, gameState.validMoves]);

    return (
        <div className="p-2 bg-gray-800 rounded-lg shadow-inner">
            <div 
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))` }}
            >
                {board.map((row, y) => 
                    row.map((cell, x) => (
                        <Cell 
                            key={`${y}-${x}`}
                            id={`cell-${y}-${x}`}
                            cellState={cell} 
                            onClick={() => onPlaceCard(x, y)}
                            isHighlighted={validMoves.some(move => move.x === x && move.y === y)}
                            isChanged={changedCells.has(`${y}-${x}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Board;