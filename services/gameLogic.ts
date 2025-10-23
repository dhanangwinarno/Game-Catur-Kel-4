import { BOARD_SIZE, MAX_TURNS, PLAYER_COLOR_ORDER } from '../constants';
import { GameState, Player, Card, BoardState, Difficulty, HistoryEntry, PlacedCard } from '../types';

// Helper to shuffle arrays
const shuffle = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// This is the core calculation logic, now kept internal.
const _calculateValidMoves = (board: BoardState, turnNumber: number, currentPlayer: Player): { x: number; y: number }[] => {
  // Rule: First turn must be in the center
  if (turnNumber === 1) {
    return [{ x: 4, y: 4 }];
  }
  
  const validMoves = new Set<string>();
  const ADJACENT_DIRECTIONS = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 },  // right
      { x: -1, y: -1 }, // top-left
      { x: 1, y: -1 },  // top-right
      { x: -1, y: 1 },  // bottom-left
      { x: 1, y: 1 },   // bottom-right
  ];

  // A move is valid if it's adjacent to any existing card
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== null) { // Find any existing card
        // Check its neighbors
        for (const dir of ADJACENT_DIRECTIONS) {
          const nx = x + dir.x;
          const ny = y + dir.y;

          if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
            const neighborCell = board[ny][nx];
            // A neighbor is a valid move spot if it's empty OR owned by an opponent
            if (neighborCell === null || neighborCell.ownerId !== currentPlayer.id) {
              validMoves.add(`${nx},${ny}`);
            }
          }
        }
      }
    }
  }

  return Array.from(validMoves).map(moveStr => {
    const [x, y] = moveStr.split(',').map(Number);
    return { x, y };
  });
};


// Initialize the game state
export const initializeGameState = (
  playerNames: string[], 
  numComputers: number, 
  difficulty: Difficulty
): GameState => {
  const players: Player[] = [];
  const colors = PLAYER_COLOR_ORDER;

  // For local games, create players as before
  const numHumanPlayers = playerNames.length;
  const totalPlayers = numHumanPlayers + numComputers;
  for (let i = 0; i < totalPlayers; i++) {
    const isComputer = i >= numHumanPlayers;
    players.push({
      id: `player${i + 1}`,
      name: isComputer ? `Comp ${i - numHumanPlayers + 1} (${difficulty})` : playerNames[i],
      color: colors[i],
      isComputer,
      score: 0,
    });
  }

  const decks: Record<string, Card[]> = {};
  const hands: Record<string, Card[]> = {};
  players.forEach(player => {
    // 1. Create the full set of cards for a player with unique IDs
    const fullCardSet: Card[] = [];
    let cardIdCounter = 0;
    for (let i = 1; i <= 9; i++) {
        fullCardSet.push({ value: i, id: `${player.id}-card-${cardIdCounter++}` });
        fullCardSet.push({ value: i, id: `${player.id}-card-${cardIdCounter++}` });
    }

    // 2. Separate small cards (1-3) from the rest
    const smallCards = fullCardSet.filter(c => c.value <= 3);
    const otherCards = fullCardSet.filter(c => c.value > 3);

    // 3. Shuffle the small cards and deal the hand from them
    shuffle(smallCards);
    hands[player.id] = smallCards.splice(0, 3);

    // 4. Combine the remaining small cards with the other cards and shuffle to form the deck
    const remainingDeck = [...smallCards, ...otherCards];
    decks[player.id] = shuffle(remainingDeck);
  });

  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  players.forEach(p => {
    p.score = 0;
  });
  
  const initialValidMoves = _calculateValidMoves(board, 1, players[0]);

  return {
    board,
    players,
    currentPlayerIndex: 0,
    hands,
    decks,
    selectedCard: null,
    isGameOver: false,
    winner: null,
    history: [],
    message: `${players[0].name}, it's your turn!`,
    turnNumber: 1,
    difficulty,
    validMoves: initialValidMoves,
  };
};

const checkForWin = (board: BoardState, playerId: string): boolean => {
  // Check for 4 in a row for the given player
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x]?.ownerId !== playerId) continue;

      // Check horizontal ->
      if (x <= BOARD_SIZE - 4) {
        if (
          board[y][x+1]?.ownerId === playerId &&
          board[y][x+2]?.ownerId === playerId &&
          board[y][x+3]?.ownerId === playerId
        ) return true;
      }
      // Check vertical v
      if (y <= BOARD_SIZE - 4) {
        if (
          board[y+1][x]?.ownerId === playerId &&
          board[y+2][x]?.ownerId === playerId &&
          board[y+3][x]?.ownerId === playerId
        ) return true;
      }
      // Check diagonal \
      if (x <= BOARD_SIZE - 4 && y <= BOARD_SIZE - 4) {
        if (
          board[y+1][x+1]?.ownerId === playerId &&
          board[y+2][x+2]?.ownerId === playerId &&
          board[y+3][x+3]?.ownerId === playerId
        ) return true;
      }
      // Check diagonal /
      if (x >= 3 && y <= BOARD_SIZE - 4) {
        if (
          board[y+1][x-1]?.ownerId === playerId &&
          board[y+2][x-2]?.ownerId === playerId &&
          board[y+3][x-3]?.ownerId === playerId
        ) return true;
      }
    }
  }
  return false;
};

// This function is now just a getter, making it extremely fast.
export const getValidMoves = (gameState: GameState): { x: number; y: number }[] => {
  return gameState.validMoves;
};

export const applyCardPlacement = (gameState: GameState, x: number, y: number): GameState | null => {
  const { board, players, currentPlayerIndex, selectedCard, hands, decks, history, turnNumber, validMoves } = gameState;

  if (!selectedCard) return null;
  
  const currentPlayer = players[currentPlayerIndex];
  const cardToPlace = hands[currentPlayer.id][selectedCard.handIndex];
  
  if (!validMoves.some(move => move.x === x && move.y === y)) {
    return null;
  }

  const targetCell = board[y][x];
  let lastCapturedCard: HistoryEntry['captured'] | undefined;

  if (targetCell) {
    if (targetCell.ownerId === currentPlayer.id) return null;
    if (cardToPlace.value <= targetCell.value) return null;

    const capturedPlayer = players.find(p => p.id === targetCell.ownerId);
    if (capturedPlayer) {
      lastCapturedCard = {
        name: capturedPlayer.name,
        value: targetCell.value,
        color: capturedPlayer.color
      };
    }
  }
  
  const newBoard = board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  newBoard[y][x] = {
    ...cardToPlace,
    color: currentPlayer.color,
    ownerId: currentPlayer.id,
  };

  const newHistoryEntry: HistoryEntry = {
      turn: turnNumber,
      playerName: currentPlayer.name,
      playerColor: currentPlayer.color,
      action: 'placed',
      cardValue: cardToPlace.value,
      position: { x, y },
      captured: lastCapturedCard,
  };

  const newHands = { ...hands };
  const newDecks = { ...decks };
  const playerHand = [...newHands[currentPlayer.id]];
  const playerDeck = [...newDecks[currentPlayer.id]];
  playerHand.splice(selectedCard.handIndex, 1);
  if (playerDeck.length > 0) {
    playerHand.push(playerDeck.shift() as Card);
  }
  newHands[currentPlayer.id] = playerHand;
  newDecks[currentPlayer.id] = playerDeck;
  
  const hasWon = checkForWin(newBoard, currentPlayer.id);
  if (hasWon) {
    const finalPlayers = players.map(p => ({...p}));
    finalPlayers.forEach(p => p.score = 0);
    for(const row of newBoard) {
        for(const cell of row) {
            if (cell) {
                const owner = finalPlayers.find(p => p.id === cell.ownerId);
                if (owner) owner.score += cell.value;
            }
        }
    }
    
    const winnerCandidate = finalPlayers.find(p => p.id === currentPlayer.id)!;
    const isDraw = finalPlayers.some(p => p.id !== currentPlayer.id && p.score === winnerCandidate.score);

    return {
      ...gameState,
      board: newBoard, players: finalPlayers, isGameOver: true,
      winner: isDraw ? null : currentPlayer,
      history: [...history, newHistoryEntry],
      message: isDraw ? `${currentPlayer.name} got 4-in-a-row, but it's a draw!` : `${currentPlayer.name} wins!`,
      validMoves: [], selectedCard: null, hands: newHands, decks: newDecks,
    };
  }
  
  const newPlayers = players.map(p => ({ ...p, score: 0 }));
  for(let row of newBoard) {
      for(let cell of row) {
          if (cell) {
              const owner = newPlayers.find(p => p.id === cell.ownerId);
              if (owner) owner.score += cell.value;
          }
      }
  }

  if (turnNumber > players.length * 3) {
      const sortedPlayers = [...newPlayers].sort((a, b) => b.score - a.score);
      const leader = sortedPlayers[0];
      const runnerUp = sortedPlayers[1] || null;

      if (leader && runnerUp && leader.score >= 50 && leader.score > runnerUp.score * 2) {
          return {
              ...gameState, board: newBoard, players: newPlayers, hands: newHands, decks: newDecks,
              selectedCard: null, isGameOver: true, winner: leader, history: [...history, newHistoryEntry],
              message: `${leader.name} wins with a dominant score!`, validMoves: [],
          };
      }
  }

  const isFinishedByCards = Object.values(newHands).every(hand => hand.length === 0);
  const isFinishedByTurns = turnNumber >= MAX_TURNS;

  if (isFinishedByCards || isFinishedByTurns) {
      const maxScore = Math.max(...newPlayers.map(p => p.score));
      const winners = newPlayers.filter(p => p.score === maxScore);
      const winner = winners.length === 1 ? winners[0] : null;
      const endMessage = winner ? `${winner.name} wins!` : "It's a draw!";
      
      return {
          ...gameState, board: newBoard, players: newPlayers, hands: newHands, decks: newDecks, selectedCard: null,
          isGameOver: true, winner, history: [...history, newHistoryEntry], message: endMessage, validMoves: [],
      };
  }

  return {
    ...gameState, board: newBoard, players: newPlayers, hands: newHands, decks: newDecks,
    selectedCard: null, history: [...history, newHistoryEntry], message: `Move accepted.`,
  };
};

export const advanceTurn = (gameState: GameState): GameState => {
  if (gameState.isGameOver) return gameState;
  
  const { players, currentPlayerIndex, board, turnNumber } = gameState;
  const nextTurnNumber = turnNumber + 1;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];

  const nextValidMoves = _calculateValidMoves(board, nextTurnNumber, nextPlayer);

  return {
    ...gameState,
    currentPlayerIndex: nextPlayerIndex,
    turnNumber: nextTurnNumber,
    message: `${nextPlayer.name}, it's your turn!`,
    validMoves: nextValidMoves,
  };
};

export const applyCardPlacementAndAdvance = (gameState: GameState, x: number, y: number): GameState | null => {
    const intermediateState = applyCardPlacement(gameState, x, y);
    if (!intermediateState || intermediateState.isGameOver) {
        return intermediateState;
    }
    return advanceTurn(intermediateState);
};


export const handlePassTurn = (gameState: GameState): GameState => {
  const { board, players, currentPlayerIndex, history, turnNumber } = gameState;
  const currentPlayer = players[currentPlayerIndex];

  const newHistoryEntry: HistoryEntry = {
    turn: turnNumber,
    playerName: currentPlayer.name,
    playerColor: currentPlayer.color,
    action: 'passed',
  };

  const stateWithHistory = { ...gameState, history: [...history, newHistoryEntry], selectedCard: null };
  return advanceTurn(stateWithHistory);
};

// --- AI Logic ---

type AiMove = { x: number; y: number; handIndex: number; value: number };

// A lightweight simulation for AI, only checks for win condition.
// It mutates the board temporarily for performance and then reverts the change.
const simulatePlacement = (board: BoardState, x: number, y: number, player: Player, card: Card): boolean => {
    const originalCell = board[y][x];
    board[y][x] = {
        ...card,
        color: player.color,
        ownerId: player.id,
    };
    const isWin = checkForWin(board, player.id);
    board[y][x] = originalCell; // Revert the change
    return isWin;
}

const getAllPossibleMoves = (gameState: GameState, player: Player, hand: Card[]): AiMove[] => {
    const { board, turnNumber } = gameState;
    const validMoves = _calculateValidMoves(board, turnNumber, player);
    
    if (!validMoves.length || !hand.length) return [];

    const allPossibleMoves: AiMove[] = [];
    for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        for (const move of validMoves) {
            const targetCell = board[move.y][move.x];
            if (!targetCell || (targetCell.ownerId !== player.id && card.value > targetCell.value)) {
                allPossibleMoves.push({ ...move, handIndex: i, value: card.value });
            }
        }
    }
    return allPossibleMoves;
};

// 'Easy' difficulty: Predictable. Always picks the move with the highest simple score (capture > high value card).
const getEasyMove = (gameState: GameState): AiMove | null => {
    const { board, players, currentPlayerIndex, hands } = gameState;
    const currentPlayer = players[currentPlayerIndex];
    const playerHand = hands[currentPlayer.id];
    const allMoves = getAllPossibleMoves(gameState, currentPlayer, playerHand);

    if (allMoves.length === 0) return null;

    // Simple greedy scoring: capture is best, then high value placement
    const scoredMoves = allMoves.map(move => {
        let score = 0;
        const targetCell = board[move.y][move.x];
        if (targetCell) {
            // Prioritize capturing opponent cards
            score += 100 + targetCell.value; 
        }
        // Add card's own value as a tie-breaker
        score += move.value; 
        return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Always pick the best move based on the simple score, making it predictable.
    return scoredMoves[0].move;
};

const evaluateWindowForAI = (window: (PlacedCard | null)[], aiPlayerId: string): number => {
    const aiCards = window.filter(c => c?.ownerId === aiPlayerId) as PlacedCard[];
    const opponentCards = window.filter(c => c && c.ownerId !== aiPlayerId) as PlacedCard[];
    const aiCount = aiCards.length;
    const opponentCount = opponentCards.length;

    if (aiCount > 0 && opponentCount > 0) return 0;

    const emptyCount = 4 - aiCount - opponentCount;
    const avgAiValue = aiCount > 0 ? aiCards.reduce((sum, c) => sum + c.value, 0) / aiCount : 0;
    const avgOpponentValue = opponentCount > 0 ? opponentCards.reduce((sum, c) => sum + c.value, 0) / opponentCount : 0;

    const WIN_SCORE = 10000;
    const IMMINENT_WIN_BLOCK_SCORE = 9000;
    const THREE_IN_A_ROW_SCORE = 500;
    const TWO_IN_A_ROW_SCORE = 50;

    let windowScore = 0;

    if (aiCount > 0) { // AI Offensive threats
        if (aiCount === 4) windowScore += WIN_SCORE;
        else if (aiCount === 3 && emptyCount === 1) windowScore += THREE_IN_A_ROW_SCORE + (avgAiValue * 10);
        else if (aiCount === 2 && emptyCount === 2) {
            const bonus = (window[0] === null && window[3] === null) ? 2.5 : 1;
            windowScore += (TWO_IN_A_ROW_SCORE * bonus) + (avgAiValue * 5);
        }
    } else if (opponentCount > 0) { // Opponent Defensive threats
        if (opponentCount === 4) windowScore -= WIN_SCORE;
        else if (opponentCount === 3 && emptyCount === 1) windowScore -= IMMINENT_WIN_BLOCK_SCORE + (avgOpponentValue * 10);
        else if (opponentCount === 2 && emptyCount === 2) {
            const penalty = (window[0] === null && window[3] === null) ? 2.5 : 1;
            windowScore -= (TWO_IN_A_ROW_SCORE * penalty) + (avgOpponentValue * 5);
        }
    }
    return windowScore;
};


// A more sophisticated evaluation function, used by Medium and Hard AI.
const evaluateBoardForAI = (board: BoardState, aiPlayerId: string): number => {
    const MATERIAL_WEIGHT = 1.0;
    const THREAT_WEIGHT = 7.5; // Increased for more aggressive play
    const POSITIONAL_WEIGHT = 1.0;
    
    const positionScores = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 2, 3, 3, 3, 3, 3, 2, 1],
        [1, 2, 3, 4, 4, 4, 3, 2, 1],
        [1, 2, 3, 4, 5, 4, 3, 2, 1], // Center is most valuable
        [1, 2, 3, 4, 4, 4, 3, 2, 1],
        [1, 2, 3, 3, 3, 3, 3, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
    
    let materialScore = 0;
    let positionalScore = 0;
    let threatScore = 0;

    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = board[y][x];
            if (cell) {
                const value = cell.value;
                if (cell.ownerId === aiPlayerId) {
                    materialScore += value;
                    positionalScore += positionScores[y][x];
                } else {
                    materialScore -= value;
                    positionalScore -= positionScores[y][x];
                }
            }
        }
    }
    
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x <= BOARD_SIZE - 4; x++) {
            threatScore += evaluateWindowForAI([board[y][x], board[y][x + 1], board[y][x + 2], board[y][x + 3]], aiPlayerId);
        }
    }
    for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y <= BOARD_SIZE - 4; y++) {
            threatScore += evaluateWindowForAI([board[y][x], board[y+1][x], board[y+2][x], board[y+3][x]], aiPlayerId);
        }
    }
    for (let y = 0; y <= BOARD_SIZE - 4; y++) {
        for (let x = 0; x <= BOARD_SIZE - 4; x++) {
            threatScore += evaluateWindowForAI([board[y][x], board[y + 1][x + 1], board[y + 2][x + 2], board[y + 3][x + 3]], aiPlayerId);
        }
    }
    for (let y = 0; y <= BOARD_SIZE - 4; y++) {
        for (let x = 3; x < BOARD_SIZE; x++) {
            threatScore += evaluateWindowForAI([board[y][x], board[y + 1][x - 1], board[y + 2][x - 2], board[y + 3][x - 3]], aiPlayerId);
        }
    }

    return (materialScore * MATERIAL_WEIGHT) + (positionalScore * POSITIONAL_WEIGHT) + (threatScore * THREAT_WEIGHT);
};

// 'Medium' difficulty: Upgraded to use the advanced evaluation function for better move selection.
const getMediumMove = (gameState: GameState): Promise<AiMove | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const { board, players, currentPlayerIndex, hands } = gameState;
            const currentPlayer = players[currentPlayerIndex];
            const playerHand = hands[currentPlayer.id];
            
            const simulationBoard = board.map(row => row.map(cell => (cell ? { ...cell } : null)));
            const allMyMoves = getAllPossibleMoves(gameState, currentPlayer, playerHand);

            if (allMyMoves.length === 0) {
                resolve(null);
                return;
            }

            // 1. Check for a winning move for self
            const winningMove = allMyMoves.find(move => 
                simulatePlacement(simulationBoard, move.x, move.y, currentPlayer, playerHand[move.handIndex])
            );
            if (winningMove) {
                resolve(winningMove);
                return;
            }

            // 2. Check to block any opponent's winning move
            for (const opponent of players) {
                if (opponent.id === currentPlayer.id) continue;
                const opponentHand = hands[opponent.id] || [];
                const opponentPossibleMoves = getAllPossibleMoves(gameState, opponent, opponentHand);

                for (const opponentMove of opponentPossibleMoves) {
                    if (simulatePlacement(simulationBoard, opponentMove.x, opponentMove.y, opponent, opponentHand[opponentMove.handIndex])) {
                         const blockingMove = allMyMoves.find(myMove => myMove.x === opponentMove.x && myMove.y === opponentMove.y);
                         if(blockingMove) {
                            resolve(blockingMove);
                            return;
                         }
                    }
                }
            }
            
            // 3. If no immediate win/block, use the advanced evaluation function to find the best immediate move.
            const scoredMoves = allMyMoves.map(move => {
                const tempBoard = board.map(r => r.map(c => c ? {...c} : null));
                const cardToPlace = playerHand[move.handIndex];
                tempBoard[move.y][move.x] = { ...cardToPlace, color: currentPlayer.color, ownerId: currentPlayer.id };
                const score = evaluateBoardForAI(tempBoard, currentPlayer.id);
                return { move, score };
            });

            scoredMoves.sort((a, b) => b.score - a.score);
            resolve(scoredMoves.length > 0 ? scoredMoves[0].move : null);
        }, 50);
    });
};


// A simple, fast deep copy for the game state objects needed by the AI.
const deepCopyAiState = (board: BoardState, hands: Record<string, Card[]>, decks: Record<string, Card[]>) => {
    const boardCopy = board.map(row => row.map(cell => (cell ? { ...cell } : null)));
    const handsCopy: Record<string, Card[]> = {};
    for (const playerId in hands) {
        handsCopy[playerId] = hands[playerId].map(card => ({ ...card }));
    }
    const decksCopy: Record<string, Card[]> = {};
    for (const playerId in decks) {
        decksCopy[playerId] = decks[playerId].map(card => ({ ...card }));
    }
    return { boardCopy, handsCopy, decksCopy };
};


// Minimax algorithm with alpha-beta pruning.
const minimax = (
    board: BoardState,
    players: Player[],
    hands: Record<string, Card[]>,
    decks: Record<string, Card[]>,
    currentPlayerIndex: number,
    turnNumber: number,
    depth: number,
    alpha: number,
    beta: number,
    aiPlayerId: string
): number => {
    const lastPlayerIndex = (currentPlayerIndex + players.length - 1) % players.length;
    if (checkForWin(board, players[lastPlayerIndex].id)) {
        return players[lastPlayerIndex].id === aiPlayerId ? (10000 + depth) : (-10000 - depth);
    }
    
    if (depth === 0 || turnNumber >= MAX_TURNS) {
        return evaluateBoardForAI(board, aiPlayerId);
    }
    
    const currentPlayer = players[currentPlayerIndex];
    const playerHand = hands[currentPlayer.id];
    const allPossibleMoves = getAllPossibleMoves({ board, turnNumber } as GameState, currentPlayer, playerHand);
    
    if (allPossibleMoves.length === 0) {
        return minimax(board, players, hands, decks, (currentPlayerIndex + 1) % players.length, turnNumber + 1, depth - 1, alpha, beta, aiPlayerId);
    }

    const isMaximizingPlayer = currentPlayer.id === aiPlayerId;
    let bestValue = isMaximizingPlayer ? -Infinity : Infinity;
    
    for (const move of allPossibleMoves) {
        const originalCell = board[move.y][move.x];
        const cardPlayed = playerHand[move.handIndex];
        const cardDrawn = decks[currentPlayer.id]?.length > 0 ? decks[currentPlayer.id][0] : null;

        board[move.y][move.x] = { ...cardPlayed, color: currentPlayer.color, ownerId: currentPlayer.id };
        playerHand.splice(move.handIndex, 1);
        if (cardDrawn) {
            decks[currentPlayer.id].shift();
            playerHand.push(cardDrawn);
        }
        
        const evaluation = minimax(board, players, hands, decks, (currentPlayerIndex + 1) % players.length, turnNumber + 1, depth - 1, alpha, beta, aiPlayerId);
        
        if (cardDrawn) {
            playerHand.pop();
            decks[currentPlayer.id].unshift(cardDrawn);
        }
        playerHand.splice(move.handIndex, 0, cardPlayed);
        board[move.y][move.x] = originalCell;

        if (isMaximizingPlayer) {
            bestValue = Math.max(bestValue, evaluation);
            alpha = Math.max(alpha, evaluation);
        } else {
            bestValue = Math.min(bestValue, evaluation);
            beta = Math.min(beta, evaluation);
        }

        if (beta <= alpha) break;
    }
    return bestValue;
};


// 'Hard' difficulty: Uses iterative deepening minimax search for highly strategic play.
const getHardMove = async (gameState: GameState): Promise<AiMove | null> => {
    const { players, currentPlayerIndex, board, hands, decks, turnNumber } = gameState;
    const currentPlayer = players[currentPlayerIndex];

    const allPossibleMoves = getAllPossibleMoves(gameState, currentPlayer, hands[currentPlayer.id]);
    if (allPossibleMoves.length === 0) return null;

    // 1. Prioritize immediate winning move for the AI.
    const winningMove = allPossibleMoves.find(move =>
        simulatePlacement(board, move.x, move.y, currentPlayer, hands[currentPlayer.id][move.handIndex])
    );
    if (winningMove) {
        return winningMove;
    }

    // 2. Prioritize blocking an opponent's immediate winning move.
    for (const opponent of players) {
        if (opponent.id === currentPlayer.id) continue;
        const opponentHand = hands[opponent.id] || [];
        const opponentMoves = getAllPossibleMoves(gameState, opponent, opponentHand);

        for (const oppMove of opponentMoves) {
            if (simulatePlacement(board, oppMove.x, oppMove.y, opponent, opponentHand[oppMove.handIndex])) {
                const blockingMove = allPossibleMoves.find(aiMove =>
                    aiMove.x === oppMove.x && aiMove.y === oppMove.y
                );
                if (blockingMove) return blockingMove;
            }
        }
    }

    // 3. If no critical moves, perform an iterative deepening search.
    const startTime = performance.now();
    const TIME_LIMIT_MS = 1800; // AI has this much time to think.
    const MAX_DEPTH = 8; // A practical upper limit for the search.

    // Heuristic move ordering to improve alpha-beta pruning efficiency.
    const getMoveHeuristicScore = (move: AiMove): number => {
        let score = 0;
        const targetCell = board[move.y][move.x];
        if (targetCell) score += 100 + targetCell.value - move.value;
        const distanceFromCenter = Math.max(Math.abs(4 - move.x), Math.abs(4 - move.y));
        score += (4 - distanceFromCenter) * 10;
        score += move.value;
        return score;
    };

    let moveOrder = allPossibleMoves.sort((a, b) => getMoveHeuristicScore(b) - getMoveHeuristicScore(a));
    let bestMoveOverall: AiMove | null = moveOrder[0] || null;

    try {
        for (let currentDepth = 1; currentDepth <= MAX_DEPTH; currentDepth++) {
            const { boardCopy, handsCopy, decksCopy } = deepCopyAiState(board, hands, decks);
            let bestMoveForThisDepth: AiMove | null = null;
            let bestScoreForThisDepth = -Infinity;

            for (const move of moveOrder) {
                // Yield to the main thread to allow UI updates (e.g., the timer) to render.
                // This prevents the intensive AI calculation from freezing the application.
                await new Promise(resolve => setTimeout(resolve, 0));
                
                if (performance.now() - startTime > TIME_LIMIT_MS) {
                    throw new Error("Time limit exceeded");
                }

                const originalCell = boardCopy[move.y][move.x];
                const playerHand = handsCopy[currentPlayer.id];
                const playerDeck = decksCopy[currentPlayer.id];
                const cardPlayed = playerHand[move.handIndex];
                const cardDrawn = playerDeck.length > 0 ? playerDeck[0] : null;

                boardCopy[move.y][move.x] = { ...cardPlayed, color: currentPlayer.color, ownerId: currentPlayer.id };
                playerHand.splice(move.handIndex, 1);
                if (cardDrawn) {
                    playerDeck.shift();
                    playerHand.push(cardDrawn);
                }

                const score = minimax(
                    boardCopy, players, handsCopy, decksCopy,
                    (currentPlayerIndex + 1) % players.length,
                    turnNumber + 1,
                    currentDepth, -Infinity, Infinity, currentPlayer.id
                );

                if (cardDrawn) {
                    playerHand.pop();
                    playerDeck.unshift(cardDrawn);
                }
                playerHand.splice(move.handIndex, 0, cardPlayed);
                boardCopy[move.y][move.x] = originalCell;

                if (score > bestScoreForThisDepth) {
                    bestScoreForThisDepth = score;
                    bestMoveForThisDepth = move;
                }
            }

            if (bestMoveForThisDepth) {
                bestMoveOverall = bestMoveForThisDepth;
                // Promote the best move found to the front for the next, deeper search.
                moveOrder = [bestMoveOverall, ...moveOrder.filter(m => m !== bestMoveOverall)];
            }
            
            if (performance.now() - startTime > TIME_LIMIT_MS) {
                break;
            }
        }
    } catch (e) {
        if ((e as Error).message !== "Time limit exceeded") {
            console.error("AI search error:", e);
        }
    }

    return bestMoveOverall || getEasyMove(gameState);
};


export const getComputerMove = async (gameState: GameState): Promise<AiMove | null> => {
    const { difficulty } = gameState;
  
    switch (difficulty) {
        case 'Easy':
            return getEasyMove(gameState);
        case 'Medium':
            return await getMediumMove(gameState);
        case 'Hard':
            return await getHardMove(gameState);
        default:
            return getEasyMove(gameState);
    }
};