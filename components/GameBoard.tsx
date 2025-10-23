import React, { useEffect, useRef, useState } from 'react';
import { GameState, SelectedCard, Card as CardType, PlayerColor } from '../types';
import Board from './Board';
import PlayerHand from './PlayerHand';
import GameInfo from './GameInfo';
import HistoryLog from './HistoryLog';
import RulesPanel from './RulesPanel';
import { applyCardPlacement, advanceTurn, applyCardPlacementAndAdvance, getComputerMove, handlePassTurn } from '../services/gameLogic';
import { playSound, startMusic, stopMusic, startTenseMusic } from '../services/audioService';
import AnimatingCard from './AnimatingCard';
import { BOARD_SIZE } from '../constants';

interface GameBoardProps {
  gameState: GameState;
  onUpdateGameState: (newState: GameState) => void;
  onRestart: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  isPaused: boolean;
  onPause: () => void;
  onSaveAndQuit: () => void;
}

interface AnimationDetails {
  card: CardType;
  color: PlayerColor;
  fromRect: DOMRect;
  toRect: DOMRect;
}

const TURN_TIME_SECONDS = 10;
const DRAW_ANIMATION_DURATION = 600;

// Helper hook to get the previous value of a prop or state
const usePrevious = <T,>(value: T): T | undefined => {
  // FIX: Explicitly provide `undefined` as the initial value to `useRef`.
  // This resolves an "Expected 1 arguments, but got 0" error that can occur
  // in some toolchains where the argument-less version is not supported.
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};


const GameBoard: React.FC<GameBoardProps> = ({ gameState, onUpdateGameState, onRestart, onUndo, onRedo, canUndo, canRedo, isMusicPlaying, onToggleMusic, isPaused, onPause, onSaveAndQuit }) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const [animationDetails, setAnimationDetails] = useState<AnimationDetails | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_SECONDS);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const gameStateRef = useRef(gameState);
  const animationDuration = 500;
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const previousGameState = usePrevious(gameState);

  const isMyTurn = !currentPlayer.isComputer;
  
  useEffect(() => {
    gameStateRef.current = gameState;
  });

  // Effect to handle dynamic music based on game tension
  useEffect(() => {
    if (isMusicPlaying && !isPaused && !gameState.isGameOver) {
      if (gameState.tensionLevel === 'high') {
        startTenseMusic();
      } else {
        startMusic();
      }
    } else {
      stopMusic();
    }
  }, [gameState.tensionLevel, isMusicPlaying, isPaused, gameState.isGameOver]);


  // Effect to detect board changes for undo/redo visual feedback
  useEffect(() => {
    if (previousGameState && previousGameState.turnNumber !== gameState.turnNumber) {
      const changes = new Set<string>();
      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          const prevCell = previousGameState.board[y][x];
          const currCell = gameState.board[y][x];
          
          // A change occurs if a card was added, removed, or replaced.
          if (prevCell?.id !== currCell?.id) {
            changes.add(`${y}-${x}`);
          }
        }
      }

      if (changes.size > 0) {
        setChangedCells(changes);
        const timer = setTimeout(() => setChangedCells(new Set()), 800); // Match animation duration
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, previousGameState]);

  const handleSelectCard = (card: SelectedCard | null) => {
    onUpdateGameState({ ...gameState, selectedCard: card });
  };

  const handlePlaceCard = (x: number, y: number) => {
    if (!gameState.selectedCard || !isMyTurn || isPaused) return;

    // --- Pre-validate the move ---
    const { board, selectedCard, validMoves, hands } = gameState;
    const cardToPlace = hands[currentPlayer.id][selectedCard.handIndex];

    if (!validMoves.some(move => move.x === x && move.y === y)) {
      playSound('invalid');
      setLocalMessage("You must place your card adjacent to another card.");
      setTimeout(() => setLocalMessage(null), 2000);
      return;
    }
    const targetCell = board[y][x];
    if (targetCell) {
      if (targetCell.ownerId === currentPlayer.id) {
        playSound('invalid');
        setLocalMessage("You cannot place a card on your own card.");
        setTimeout(() => setLocalMessage(null), 2000);
        return;
      }
      if (cardToPlace.value <= targetCell.value) {
        playSound('invalid');
        setLocalMessage("Your card's value must be higher to capture an opponent's card.");
        setTimeout(() => setLocalMessage(null), 2000);
        return;
      }
    }

    const performUpdate = () => {
        // Step 1: Apply the move but don't change the player yet
        const intermediateState = applyCardPlacement(gameState, x, y);

        if (intermediateState) {
            playSound('place');
            // FIX: Replaced .at(-1) with bracket notation for broader compatibility.
            if (intermediateState.history[intermediateState.history.length - 1]?.captured) playSound('capture');
            if (gameState.decks[currentPlayer.id].length > 0) playSound('draw');

            // This update shows the new card in the hand, triggering the draw animation
            onUpdateGameState(intermediateState);
            setTimeLeft(TURN_TIME_SECONDS); // Reset timer to prevent auto-pass during animation

            // If the game ends on this move, don't advance the turn
            if (intermediateState.isGameOver) return;

            // Step 2: After a delay for the draw animation, advance the turn
            setTimeout(() => {
                const finalState = advanceTurn(intermediateState);
                onUpdateGameState(finalState);
            }, DRAW_ANIMATION_DURATION);
        } else {
            playSound('invalid');
            setLocalMessage("Invalid move. Try another spot!");
            setTimeout(() => setLocalMessage(null), 2000);
        }
    };

    const fromElement = document.getElementById(`player-hand-card-${selectedCard.handIndex}`);
    const toElement = document.getElementById(`cell-${y}-${x}`);

    if (fromElement && toElement) {
        playSound('move');
        setAnimationDetails({
            card: cardToPlace,
            color: currentPlayer.color,
            fromRect: fromElement.getBoundingClientRect(),
            toRect: toElement.getBoundingClientRect(),
        });
        setTimeout(() => {
            performUpdate();
            setAnimationDetails(null);
        }, animationDuration);
    } else {
        performUpdate();
    }
  };

  const handlePass = () => {
    if (!isMyTurn || isPaused) return;
    playSound('passTurn');
    const newState = handlePassTurn(gameState);
    onUpdateGameState(newState);
  };

  useEffect(() => {
    const makeAiMove = async () => {
      const currentGameState = gameStateRef.current;
      if (!currentGameState.players[currentGameState.currentPlayerIndex].isComputer || currentGameState.isGameOver || isPaused) {
        setIsAiThinking(false);
        return;
      }
      
      setIsAiThinking(true);
      const thinkStartTime = Date.now();
      const move = await getComputerMove(currentGameState);
      const thinkTime = Date.now() - thinkStartTime;
      
      const minThinkTime = 2500;
      if (thinkTime < minThinkTime) {
          await new Promise(resolve => setTimeout(resolve, minThinkTime - thinkTime));
      }
      
      const afterThinkGameState = gameStateRef.current;
      if (afterThinkGameState.currentPlayerIndex !== currentGameState.currentPlayerIndex || isPaused) {
        setIsAiThinking(false);
        return; 
      }
      
      setIsAiThinking(false);

      const processAndSetAiMove = (move: { x: number; y: number; handIndex: number; value: number }) => {
        const tempStateWithSelectedCard: GameState = {
          ...afterThinkGameState,
          selectedCard: { handIndex: move.handIndex, value: move.value }
        };
        const newState = applyCardPlacementAndAdvance(tempStateWithSelectedCard, move.x, move.y);
        if (newState) {
          playSound('place');
          // FIX: Replaced .at(-1) with bracket notation for broader compatibility.
          if (newState.history[newState.history.length - 1]?.captured) playSound('capture');
          if ((afterThinkGameState.decks[currentPlayer.id]?.length || 0) > 0) playSound('draw');
          onUpdateGameState(newState);
        }
      };
      
      if (move) {
        const fromElement = document.getElementById('game-info-panel');
        const toElement = document.getElementById(`cell-${move.y}-${move.x}`);
        if (fromElement && toElement) {
          playSound('move');
          const cardToAnimate = afterThinkGameState.hands[currentPlayer.id][move.handIndex];
          setAnimationDetails({
            card: cardToAnimate,
            color: currentPlayer.color,
            fromRect: fromElement.getBoundingClientRect(),
            toRect: toElement.getBoundingClientRect(),
          });
          setTimeout(() => {
            processAndSetAiMove(move);
            setAnimationDetails(null);
          }, animationDuration);
        } else {
          processAndSetAiMove(move);
        }
      } else {
        playSound('passTurn'); 
        const newState = handlePassTurn(afterThinkGameState);
        onUpdateGameState(newState);
      }
    };

    if (currentPlayer.isComputer && !gameState.isGameOver && !animationDetails && !canRedo && !isPaused) {
      makeAiMove();
    } else {
      setIsAiThinking(false);
    }
  }, [currentPlayer.id, gameState.turnNumber, animationDetails, canRedo, onUpdateGameState, isPaused]);

  useEffect(() => {
    if (gameState.isGameOver || isPaused) {
        return;
    }

    setTimeLeft(TURN_TIME_SECONDS);

    const intervalId = setInterval(() => {
        setTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
                clearInterval(intervalId);
                
                const latestGameState = gameStateRef.current;
                if (!latestGameState.isGameOver && latestGameState.turnNumber === gameState.turnNumber) {
                    playSound('passTurn');
                    onUpdateGameState(handlePassTurn(latestGameState));
                }
                return 0;
            }
            return newTime;
        });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameState.turnNumber, gameState.isGameOver, isPaused]);


  return (
    <div className="w-full h-screen p-4 flex items-start justify-center gap-4">
       {animationDetails && (
        <AnimatingCard 
          card={animationDetails.card}
          color={animationDetails.color}
          fromRect={animationDetails.fromRect}
          toRect={animationDetails.toRect}
          animationDuration={animationDuration}
        />
      )}
      
      <div className="w-1/5 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <RulesPanel />
      </div>

      <div className="w-3/5 flex-shrink-0 flex flex-col items-center justify-between h-full">
        <GameInfo 
          message={isAiThinking ? `${currentPlayer.name} is thinking...` : (localMessage || gameState.message)}
          currentPlayer={currentPlayer}
          decks={gameState.decks}
          players={gameState.players}
          timeLeft={timeLeft}
          turnDuration={TURN_TIME_SECONDS}
          isPaused={isPaused}
        />
        <Board gameState={gameState} onPlaceCard={handlePlaceCard} changedCells={changedCells} />
        
        <div className="flex items-center justify-center gap-4">
            <PlayerHand 
                hand={gameState.hands[currentPlayer.id] || []}
                player={currentPlayer}
                selectedCard={gameState.selectedCard}
                onSelectCard={handleSelectCard}
                isPlayerTurn={isMyTurn && !isPaused}
                onPass={handlePass}
            />
            <div className="flex flex-col gap-2 self-center">
              <div className="flex gap-2">
                <button
                  onClick={onUndo}
                  disabled={!canUndo || isPaused}
                  className="px-4 py-2 text-md font-semibold rounded-lg shadow-md transition-all bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Undo
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo || isPaused}
                  className="px-4 py-2 text-md font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Redo
                </button>
                <button
                  onClick={onPause}
                  title="Pause Game"
                  className="px-3 py-2 text-xl font-semibold rounded-lg shadow-md transition-all bg-gray-500 text-white hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  ⏸️
                </button>
                <button
                  onClick={onToggleMusic}
                  disabled={isPaused}
                  title={isMusicPlaying ? 'Mute Music' : 'Play Music'}
                  className="px-3 py-2 text-xl font-semibold rounded-lg shadow-md transition-all bg-purple-500 text-white hover:bg-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isMusicPlaying ? '🔇' : '🎵'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                    onClick={onSaveAndQuit}
                    disabled={isPaused}
                    className="w-full px-4 py-2 text-md font-semibold rounded-lg shadow-md transition-all bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Save & Quit
                </button>
                <button
                    onClick={() => { playSound('click'); onRestart(); }}
                    disabled={isPaused}
                    className="w-full px-4 py-2 text-md font-semibold rounded-lg shadow-md transition-all bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Reset Game
                </button>
              </div>
            </div>
        </div>
      </div>

      <div className="w-1/5 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        <HistoryLog history={gameState.history} />
      </div>
    </div>
  );
};

export default GameBoard;