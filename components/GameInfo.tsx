
import React from 'react';
import { Player, Card } from '../types';
import { PLAYER_COLORS } from '../constants';

interface GameInfoProps {
    message: string;
    currentPlayer: Player;
    decks: Record<string, Card[]>;
    players: Player[];
    timeLeft: number;
    turnDuration: number;
    isPaused?: boolean;
}

const GameInfo: React.FC<GameInfoProps> = ({ message, currentPlayer, decks, players, timeLeft, turnDuration, isPaused = false }) => {
    // FIX: Explicitly type the accumulator `sum` to `number` to resolve a type inference issue.
    const totalRemainingCards = Object.values(decks).reduce((sum: number, deck: Card[]) => sum + deck.length, 0);
    const progress = (timeLeft / turnDuration) * 100;
    
    let progressColor = 'bg-green-500';
    if (progress < 50) progressColor = 'bg-yellow-500';
    if (progress < 25) progressColor = 'bg-red-500';
    
    const theme = PLAYER_COLORS[currentPlayer.color];
    const displayedTime = Math.ceil(timeLeft);
    const isAiTurn = currentPlayer.isComputer;

    return (
        <div id="game-info-panel" className="w-full flex flex-col items-center">
            <div className="w-full max-w-2xl shadow-lg">
                <div className={`p-3 rounded-t-lg text-center font-semibold text-lg ${theme.bg} ${theme.text} relative`}>
                    Turn: {currentPlayer.name}
                    <span key={displayedTime} className="absolute right-4 top-1/2 -translate-y-1/2 font-bold animate-timer-pulse">
                        {isPaused ? 'Paused' : `${displayedTime}s`}
                    </span>
                </div>
                <div className="bg-gray-400 rounded-b-lg h-2 overflow-hidden">
                    <div 
                        className={`h-full ${isPaused ? 'bg-gray-500' : progressColor} transition-all duration-1000 ease-linear ${isAiTurn && !isPaused ? 'animate-scanner' : ''}`}
                        style={{ width: isPaused ? '100%' : `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex justify-center items-center gap-3 flex-wrap w-full max-w-4xl mt-2 text-white drop-shadow-md">
                {players.map(p => (
                    <div key={p.id} className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${PLAYER_COLORS[p.color].bg} ${PLAYER_COLORS[p.color].text}`}>
                        {p.name}: {decks[p.id].length} cards
                    </div>
                ))}
                <div className="font-bold text-white px-3 py-1 rounded-md text-sm whitespace-nowrap" style={{ backgroundColor: '#8B4513' }}>Card Left: {totalRemainingCards}</div>
            </div>
             <p className="mt-2 text-center text-white font-medium h-6 drop-shadow-lg">{message}</p>
        </div>
    );
};

export default GameInfo;