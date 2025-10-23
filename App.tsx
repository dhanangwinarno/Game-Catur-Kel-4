
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

const SAVED_GAME_KEY = 'savedTacticalCardConquestGame';

const App: React.FC = () => {
  const [history, setHistory] = useState<GameState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isStarting, setIsStarting] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [savedGameExists, setSavedGameExists] = useState(false);
  
  const currentGameState = history[historyIndex];

  useEffect(() => {
    try {
        const savedGameJSON = localStorage.getItem(SAVED_GAME_KEY);
        if (savedGameJSON) {
            const savedGame = JSON.parse(savedGameJSON);
            if (savedGame.history && savedGame.history.length > 0) {
                setSavedGameExists(true);
            } else {
                localStorage.removeItem(SAVED_GAME_KEY);
            }
        }
    } catch (e) {
        console.error("Error checking for saved game:", e);
        localStorage.removeItem(SAVED_GAME_KEY);
    }
  }, []);

  const saveGame = (historyToSave: GameState[], indexToSave: number) => {
      if (historyToSave.length > 0 && indexToSave >= 0 && !historyToSave[indexToSave].isGameOver) {
          const gameStateToSave = {
              history: historyToSave,
              historyIndex: indexToSave,
          };
          localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(gameStateToSave));
      } else {
          localStorage.removeItem(SAVED_GAME_KEY);
      }
  };

  const handleStartGame = (playerNames: string[], numComputers: number, difficulty: Difficulty) => {
    localStorage.removeItem(SAVED_GAME_KEY);
    setSavedGameExists(false);
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
    localStorage.removeItem(SAVED_GAME_KEY);
    setSavedGameExists(false);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const updateGameState = (newState: GameState) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    const newIndex = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(newIndex);
    saveGame(newHistory, newIndex);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      playSound('undo');
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      saveGame(history, newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      playSound('redo');
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      saveGame(history, newIndex);
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

  const handleResumeGame = () => {
    try {
        const savedGameJSON = localStorage.getItem(SAVED_GAME_KEY);
        if (savedGameJSON) {
            const savedGame: { history: GameState[], historyIndex: number } = JSON.parse(savedGameJSON);
            setHistory(savedGame.history);
            setHistoryIndex(savedGame.historyIndex);
            setSavedGameExists(false);
        }
    } catch (e) {
        console.error("Failed to resume game:", e);
        localStorage.removeItem(SAVED_GAME_KEY);
    }
  };

  const handleSaveAndQuit = () => {
    if (currentGameState) {
        saveGame(history, historyIndex);
        playSound('click');
        setHistory([]);
        setHistoryIndex(-1);
        setSavedGameExists(true);
    }
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
      localStorage.removeItem(SAVED_GAME_KEY);
      setSavedGameExists(false);
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
        <StartMenu
            onStartGame={handleStartGame}
            savedGameExists={savedGameExists}
            onResumeGame={handleResumeGame}
        />
      ) : (
        <>
          <GameBoard
            gameState={currentGameState}
            onUpdateGameState={updateGameState}
            onRestart={handleRestart}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0 && !currentGameState.players[currentGameState.currentPlayerIndex].isComputer}
            canRedo={historyIndex < history.length - 1}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            isPaused={isPaused}
            onPause={handlePause}
            onSaveAndQuit={handleSaveAndQuit}
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
