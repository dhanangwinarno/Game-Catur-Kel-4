import React, { useState } from 'react';
import { playSound } from '../services/audioService';
import { Difficulty } from '../types';
import HallOfFame from './HallOfFame';
import { PLAYER_COLOR_ORDER, PLAYER_COLORS } from '../constants';

interface StartMenuProps {
  onStartGame: (playerNames: string[], numComputers: number, difficulty: Difficulty) => void;
  savedGameExists: boolean;
  onResumeGame: () => void;
}

const pvpOptions = [2, 3, 4];
const pvcOptions = [1, 2, 3, 4, 5];

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, savedGameExists, onResumeGame }) => {
  const [view, setView] = useState<'main' | 'game_type' | 'pvp_setup' | 'pvc_setup' | 'names' | 'hall_of_fame'>('main');
  
  const [numHumanPlayers, setNumHumanPlayers] = useState(2);
  const [numComputers, setNumComputers] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  const handleNavigate = (targetView: typeof view) => {
    playSound('click');
    setView(targetView);
  };
  
  const handleContinueToNames = (humans: number, comps: number) => {
    playSound('click');
    setNumHumanPlayers(humans);
    setNumComputers(comps);
    setPlayerNames(Array(humans).fill('').map((_, i) => `Player ${i + 1}`));
    setView('names');
  };

  const handleStartGame = () => {
    playSound('click');
    const trimmedNames = playerNames.map(name => name.trim());
    if (trimmedNames.some(name => name === '')) return;

    onStartGame(trimmedNames, numComputers, difficulty);
  };
  
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handlePlayClick = () => {
    if (savedGameExists) {
        if (window.confirm('Starting a new game will overwrite your saved progress. Are you sure?')) {
            handleNavigate('game_type');
        }
    } else {
        handleNavigate('game_type');
    }
  };

  if (view === 'hall_of_fame') {
    return <HallOfFame onBack={() => handleNavigate('main')} />;
  }

  if (view === 'names') {
    const handleBack = () => {
      playSound('click');
      setView(numComputers > 0 ? 'pvc_setup' : 'pvp_setup');
    };
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
          <button onClick={handleBack} className="mt-2 text-gray-400 hover:text-white font-semibold">
            ← Back
          </button>
        </div>
      </div>
    );
  }
  
  const SetupScreen: React.FC<{
      title: string;
      options: number[];
      selectedOption: number;
      onSelectOption: (option: number) => void;
      onContinue: () => void;
      onBack: () => void;
      children?: React.ReactNode;
      optionPrefix?: string;
      optionSuffix: string;
  }> = ({ title, options, selectedOption, onSelectOption, onContinue, onBack, children, optionPrefix = '', optionSuffix }) => (
      <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-md transition-all duration-300 text-white animate-fade-in">
          <h2 className="text-3xl font-bold mb-4 text-center drop-shadow-md">{title}</h2>
          <div className="space-y-4">
              <div>
                  <label className="block text-lg font-bold mb-2 drop-shadow-sm">Number of {optionSuffix}</label>
                  <div className="grid grid-cols-3 gap-2">
                      {options.map(option => (
                          <button
                              key={option}
                              onClick={() => { playSound('click'); onSelectOption(option); }}
                              className={`py-2 px-4 rounded-lg font-semibold transition-all ${selectedOption === option ? 'bg-sky-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                          >
                              {optionPrefix}{option}
                          </button>
                      ))}
                  </div>
              </div>
              {children}
          </div>
          <button 
            onClick={onContinue} 
            className="mt-6 w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600"
          >
            Continue
          </button>
          <button onClick={onBack} className="mt-4 hover:text-gray-200 font-semibold w-full drop-shadow-sm">
              ← Back
          </button>
      </div>
  );

  if (view === 'pvc_setup') {
    return (
        <SetupScreen
            title="Player vs Computer"
            options={pvcOptions}
            selectedOption={numComputers}
            onSelectOption={setNumComputers}
            onContinue={() => handleContinueToNames(1, numComputers)}
            onBack={() => handleNavigate('game_type')}
            optionSuffix="Computers"
        >
          <div className="animate-fade-in">
            <h3 className="block text-lg font-bold mb-2 drop-shadow-sm">Choose AI Difficulty</h3>
            <div className="flex w-full rounded-lg shadow-md overflow-hidden border border-gray-600">
                <button
                    onClick={() => { playSound('click'); setDifficulty('Easy'); }}
                    className={`flex-1 py-2 text-md font-semibold transition-all text-white ${difficulty === 'Easy' ? 'bg-green-600 shadow-[0_0_15px_theme(colors.green.400)] animate-scanner' : 'bg-green-500/50 hover:bg-green-500/80'}`}
                >
                    Easy
                </button>
                <button
                    onClick={() => { playSound('click'); setDifficulty('Medium'); }}
                    className={`flex-1 py-2 text-md font-semibold transition-all text-white border-x border-gray-600 ${difficulty === 'Medium' ? 'bg-yellow-600 shadow-[0_0_15px_theme(colors.yellow.400)] animate-scanner' : 'bg-yellow-500/50 hover:bg-yellow-500/80'}`}
                >
                    Medium
                </button>
                <button
                    onClick={() => { playSound('click'); setDifficulty('Hard'); }}
                    className={`flex-1 py-2 text-md font-semibold transition-all text-white ${difficulty === 'Hard' ? 'bg-red-600 shadow-[0_0_15px_theme(colors.red.400)] animate-scanner' : 'bg-red-500/50 hover:bg-red-500/80'}`}
                >
                    Hard
                </button>
            </div>
          </div>
        </SetupScreen>
    );
  }

  if (view === 'pvp_setup') {
      return (
          <SetupScreen
              title="Player vs Player"
              options={pvpOptions}
              selectedOption={numHumanPlayers}
              onSelectOption={setNumHumanPlayers}
              onContinue={() => handleContinueToNames(numHumanPlayers, 0)}
              onBack={() => handleNavigate('game_type')}
              optionSuffix="Players"
          />
      );
  }

  if (view === 'game_type') {
    return (
      <div className="bg-gray-800/60 backdrop-blur-md rounded-xl p-8 shadow-lg w-full max-w-sm transition-all duration-300 text-white animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 text-center drop-shadow-md">Choose Game Type</h2>
        <div className="flex flex-col gap-4">
             <button 
              onClick={() => handleNavigate('pvp_setup')}
              className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600"
            >
              Player vs Player
            </button>
            <button 
              onClick={() => handleNavigate('pvc_setup')}
              className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-teal-500 text-white hover:bg-teal-600"
            >
              Player vs Comp
            </button>
        </div>
        <button onClick={() => handleNavigate('main')} className="mt-6 hover:text-gray-200 font-semibold w-full drop-shadow-sm">
            ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
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
        className="bg-gray-800/60 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-lg transition-all duration-300">
          <p 
            className="text-xl font-semibold text-white mb-4 text-center"
            style={{ textShadow: '2px 2px 4px #000000' }}
          >
            Game presented by Dhanang, Raditha and Shinta.
          </p>
          <div className="flex flex-col gap-4 mt-4">
              {savedGameExists && (
                  <button
                      onClick={onResumeGame}
                      className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-yellow-500 text-white hover:bg-yellow-600 animate-pulse"
                  >
                      Resume Game
                  </button>
              )}
               <button 
                onClick={handlePlayClick}
                className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600"
              >
                {savedGameExists ? 'Start New Game' : 'Play Game'}
              </button>
              <button 
                onClick={() => handleNavigate('hall_of_fame')}
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