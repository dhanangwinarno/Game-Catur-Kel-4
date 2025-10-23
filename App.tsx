
import React, { useState, useEffect } from 'react';
import StartMenu from './components/StartMenu';
import GameBoard from './components/GameBoard';
import GameOverModal from './components/GameOverModal';
import { GameState, Difficulty, GameRecord } from './types';
import { initializeGameState } from './services/gameLogic';
import { playSound, startMusic, stopMusic, stopEndGameMusic } from './services/audioService';
import Confetti from './components/Confetti';
import GameStartAnimation from './components/GameStartAnimation';
import PauseModal from './components/PauseModal';

const App: React.FC = () => {
  const [history, setHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isStarting, setIsStarting] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentGameState = history[historyIndex];

  const handleStartGame = (playerNames: string[], numComputers: number, difficulty: Difficulty) => {
    setIsStarting(true);
    
    setTimeout(() => {
        const initialState = initializeGameState(playerNames, numComputers, difficulty);
        setHistory([initialState]);
        setHistoryIndex(0);
        setIsStarting(false);
    }, 2800);
  };
  
  const handleRestart = () => {
    stopEndGameMusic();
    setHistory([]);
    setHistoryIndex(-1);
  };

  const updateGameState = (newState: GameState) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      playSound('undo');
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      playSound('redo');
      // FIX: Redo should increment the history index, not decrement it.
      setHistoryIndex(historyIndex + 1);
    }
  };
  
  const handleToggleMusic = () => {
    playSound('click');
    setIsMusicPlaying(prev => !prev);
  };
  
  const handlePause = () => {
    playSound('pause');
    setIsPaused(true);
  };

  const handleResume = () => {
    playSound('resume');
    setIsPaused(false);
  };

  useEffect(() => {
    if (isMusicPlaying && !currentGameState?.isGameOver && !isPaused) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [isMusicPlaying, currentGameState?.isGameOver, isPaused]);

  useEffect(() => {
    if (currentGameState?.isGameOver) {
      stopMusic();
      if (currentGameState.winner) {
        playSound('win');
        
        const newRecord: GameRecord = {
            id: `${new Date().toISOString()}-${Math.random()}`,
            winnerName: currentGameState.winner.name,
            score: currentGameState.winner.score,
            difficulty: currentGameState.difficulty,
            numPlayers: currentGameState.players.length,
            date: new Date().toISOString(),
        };

        try {
            const storageKey = 'tacticalCardConquest_hallOfFame';
            const existingRecordsRaw = localStorage.getItem(storageKey);
            const existingRecords: GameRecord[] = existingRecordsRaw ? JSON.parse(existingRecordsRaw) : [];
            
            const updatedRecords = [...existingRecords, newRecord];
            updatedRecords.sort((a, b) => b.score - a.score); // Sort by score descending
            
            localStorage.setItem(storageKey, JSON.stringify(updatedRecords.slice(0, 10))); // Keep top 10 scores
        } catch (e) {
            console.error("Failed to save high score:", e);
        }
      } else {
        playSound('lose');
      }
    }
  }, [currentGameState?.isGameOver, currentGameState?.winner]);

  return (
    <main className="w-screen h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 flex items-center justify-center font-sans overflow-hidden">
      {isStarting ? (
        <GameStartAnimation />
      ) : !currentGameState ? (
        <StartMenu onStartGame={handleStartGame} />
      ) : (
        <>
          <GameBoard
            gameState={currentGameState}
            onUpdateGameState={updateGameState}
            onRestart={handleRestart}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            isPaused={isPaused}
            onPause={handlePause}
          />
          {isPaused && <PauseModal onResume={handleResume} />}
          {currentGameState.isGameOver && (
            <GameOverModal
              winner={currentGameState.winner}
              scores={currentGameState.players}
              onRestart={handleRestart}
            />
          )}
          {currentGameState.isGameOver && currentGameState.winner && <Confetti />}
        </>
      )}
    </main>
  );
};

// FIX: Add default export to make the component available for import in index.tsx.
export default App;