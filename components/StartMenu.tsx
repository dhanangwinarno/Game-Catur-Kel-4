
import React, { useState } from 'react';
import { playSound } from '../services/audioService';
import { Difficulty } from '../types';
import HallOfFame from './HallOfFame';
import { PLAYER_COLOR_ORDER, PLAYER_COLORS } from '../constants';

interface StartMenuProps {
  onStartGame: (playerNames: string[], numComputers: number, difficulty: Difficulty) => void;
}

const gameModes = [
  { label: 'Select a mode...', value: 'none', players: 0, computers: 0 },
  { label: '2 Players', value: '2p0c', players: 2, computers: 0 },
  { label: '3 Players', value: '3p0c', players: 3, computers: 0 },
  { label: '4 Players', value: '4p0c', players: 4, computers: 0 },
  { label: 'Player vs 1 Comp', value: '1p1c', players: 2, computers: 1 },
  { label: 'Player vs 2 Comps', value: '1p2c', players: 3, computers: 2 },
  { label: 'Player vs 3 Comps', value: '1p3c', players: 4, computers: 3 },
];

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame }) => {
  const [view, setView] = useState<'main' | 'local_mode' | 'names' | 'hall_of_fame'>('main');
  const [selectedMode, setSelectedMode] = useState(gameModes[0]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  const handleContinueToNames = () => {
    playSound('click');
    const numHumanPlayers = selectedMode.players - selectedMode.computers;
    setPlayerNames(Array(numHumanPlayers).fill('').map((_, i) => `Player ${i + 1}`));
    setView('names');
  };

  const handleStartGame = () => {
    playSound('click');
    const trimmedNames = playerNames.map(name => name.trim());
    if (trimmedNames.some(name => name === '')) return;

    onStartGame(trimmedNames, selectedMode.computers, difficulty);
  };
  
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleBackToMain = () => {
    playSound('click');
    setView('main');
  }

  if (view === 'hall_of_fame') {
    return <HallOfFame onBack={handleBackToMain} />;
  }

  if (view === 'names') {
    return (
      <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-sm transition-all duration-300 animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Enter Player Names</h2>
        <div className="grid grid-cols-1 gap-4 w-full">
          {playerNames.map((name, index) => {
            const color = PLAYER_COLOR_ORDER[index];
            const theme = PLAYER_COLORS[color];
            return (
              <div key={index}>
                <label htmlFor={`player-name-${index}`} className="flex items-center gap-2 text-gray-300 text-sm font-bold mb-1">
                  <span className={`w-4 h-4 rounded-full ${theme.bg} border-2 ${theme.border}`}></span>
                  Player {index + 1}
                </label>
                <input
                  id={`player-name-${index}`}
                  type="text"
                  value={name}
                  maxLength={15}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className={`w-full px-4 py-2 text-lg font-semibold rounded-lg shadow-md bg-gray-900 border-2 ${theme.border} text-white placeholder-gray-400 focus:ring-2 ${theme.ring} focus:outline-none transition-colors`}
                  autoFocus={index === 0}
                />
              </div>
            );
          })}
          <button
            onClick={handleStartGame}
            disabled={playerNames.some(name => name.trim() === '')}
            className="mt-4 w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Start Game
          </button>
          <button onClick={() => { playSound('click'); setView('local_mode'); }} className="mt-2 text-gray-400 hover:text-white font-semibold">
            ← Back
          </button>
        </div>
      </div>
    );
  }
  
  if (view === 'local_mode') {
      return (
        <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-sm transition-all duration-300 text-white">
            <h2 className="text-3xl font-bold mb-4 text-center drop-shadow-md">Tactical Card Conquest</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="game-mode" className="block text-lg font-bold mb-2 drop-shadow-sm">Choose Game Mode</label>
                    <select 
                      id="game-mode"
                      value={selectedMode.value}
                      onChange={(e) => setSelectedMode(gameModes.find(m => m.value === e.target.value) || gameModes[0])}
                      className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md border bg-gray-900 border-gray-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      {gameModes.map(mode => (
                        <option key={mode.value} value={mode.value} disabled={mode.value === 'none'}>{mode.label}</option>
                      ))}
                    </select>
                </div>
                
                {selectedMode.computers > 0 && (
                  <div className="animate-fade-in">
                    <h3 className="block text-lg font-bold mb-2 drop-shadow-sm">Choose AI Difficulty</h3>
                    <div className="flex w-full rounded-lg shadow-md overflow-hidden border border-gray-600">
                        <button
                            onClick={() => { playSound('click'); setDifficulty('Easy'); }}
                            className={`flex-1 py-2 text-md font-semibold transition-all text-white ${difficulty === 'Easy' ? 'bg-green-600' : 'bg-green-500/50 hover:bg-green-500/80'}`}
                        >
                            Easy
                        </button>
                        <button
                            onClick={() => { playSound('click'); setDifficulty('Medium'); }}
                            className={`flex-1 py-2 text-md font-semibold transition-all text-white border-x border-gray-600 ${difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-yellow-500/50 hover:bg-yellow-500/80'}`}
                        >
                            Medium
                        </button>
                        <button
                            onClick={() => { playSound('click'); setDifficulty('Hard'); }}
                            className={`flex-1 py-2 text-md font-semibold transition-all text-white ${difficulty === 'Hard' ? 'bg-red-600' : 'bg-red-500/50 hover:bg-red-500/80'}`}
                        >
                            Hard
                        </button>
                    </div>
                  </div>
                )}
            </div>

            <button 
              onClick={handleContinueToNames} 
              disabled={selectedMode.value === 'none'}
              className="mt-6 w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue
            </button>
             <button onClick={handleBackToMain} className="mt-4 hover:text-gray-200 font-semibold w-full drop-shadow-sm">
                ← Back
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <h1 
        className="text-5xl font-extrabold text-white mb-4 animate-text-glow drop-shadow-[0_2px_10px_rgba(14,165,233,0.7)]"
      >
        Tactical Card Conquest
      </h1>
      <p 
        className="text-lg text-gray-300 mb-8 italic max-w-md"
        style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.9)' }}
      >
        Tactical Card Conquest is a modern board game inspired by local wisdom and developed with a number-based strategy concept.
      </p>
      
      <div 
        className="bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-red-700 via-yellow-400 via-green-500 via-blue-600 via-white via-amber-800 to-black rounded-xl p-6 shadow-lg w-full max-w-lg transition-all duration-300">
          <p 
            className="text-xl font-semibold text-white mb-4 text-center"
            style={{ textShadow: '2px 2px 4px #000000' }}
          >
            Game presented by Dhanang, Raditha and Shinta.
          </p>
          <p 
            className="italic text-gray-200 mt-2 text-sm text-center"
            style={{ textShadow: '1px 1px 2px #000000' }}
          >
            Enjoy the game!
          </p>
          <div className="flex flex-col gap-4 mt-4">
               <button 
                onClick={() => { playSound('click'); setView('local_mode'); }}
                className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600"
              >
                Play Game
              </button>
              <button 
                onClick={() => { playSound('click'); setView('hall_of_fame'); }}
                className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600"
              >
                Hall of Fame
              </button>
          </div>
      </div>
    </div>
  );
};

export default StartMenu;