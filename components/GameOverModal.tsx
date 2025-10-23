import React from 'react';
import { Player } from '../types';
import { PLAYER_COLORS } from '../constants';

interface GameOverModalProps {
  winner: Player | null;
  scores: Player[];
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ winner, scores, onRestart }) => {
  const sortedPlayers = [...scores].sort((a, b) => b.score - a.score);
  const winnerTheme = winner ? PLAYER_COLORS[winner.color] : null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4">
      <div 
        className="rounded-xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center bg-cover bg-center max-h-[90vh] overflow-y-auto"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=1974&auto=format&fit=crop')" }}
      >
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-2">Game Over!</h2>
        
        {winner && winnerTheme ? (
            <div className={`py-2 px-4 rounded-lg inline-block ${winnerTheme.bg} ${winnerTheme.text} ${winnerTheme.shadow}`}>
                <h3 className="text-2xl font-bold">{winner.name} wins!</h3>
            </div>
        ) : (
            <div className={`py-2 px-4 rounded-lg inline-block bg-gray-500 text-white shadow-lg`}>
                <h3 className="text-2xl font-bold">It's a Draw!</h3>
            </div>
        )}

        <div className="mt-6 w-full">
          <h4 className="text-xl font-semibold text-gray-200 drop-shadow-md mb-3">Final Scores:</h4>
          <ul className="space-y-2">
            {sortedPlayers.map((player) => {
              const theme = PLAYER_COLORS[player.color];
              const isWinner = winner && player.id === winner.id;
              return (
                <li key={player.id} className={`flex justify-between items-center p-3 rounded-lg font-bold text-lg ${theme.bg} ${theme.text} shadow-md ${isWinner ? 'ring-4 ring-yellow-400' : ''}`}>
                   <span className="flex items-center">
                        {isWinner && <span className="mr-2">👑</span>}
                        {player.name}
                    </span>
                  <span>{player.score} Points</span>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 w-full px-4 py-3 text-xl font-bold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300"
        >
          Play Again
        </button>
        <p className="mt-2 text-xs italic text-gray-300">Thanks for playing</p>
      </div>
    </div>
  );
};

export default GameOverModal;