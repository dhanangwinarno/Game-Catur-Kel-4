export type PlayerColor = 'red' | 'yellow' | 'green' | 'blue';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Card {
  value: number;
  id: string;
}

export interface PlacedCard extends Card {
  color: PlayerColor;
  ownerId: string;
}

export type CellState = PlacedCard | null;

export type BoardState = CellState[][];

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isComputer: boolean;
  score: number;
}

export interface SelectedCard {
  handIndex: number;
  value: number;
}

export interface HistoryEntry {
  turn: number;
  playerName: string;
  playerColor: PlayerColor;
  action: 'placed' | 'passed';
  cardValue?: number;
  position?: { x: number; y: number };
  captured?: {
    name: string;
    value: number;
    color: PlayerColor;
  };
}

export interface GameState {
  board: BoardState;
  players: Player[];
  currentPlayerIndex: number;
  hands: Record<string, Card[]>; // Player ID -> Hand
  decks: Record<string, Card[]>;  // Player ID -> Deck
  selectedCard: SelectedCard | null;
  isGameOver: boolean;
  winner: Player | null;
  history: HistoryEntry[];
  message: string;
  turnNumber: number;
  difficulty: Difficulty;
  validMoves: { x: number; y: number }[];
}

export interface GameRecord {
  id: string;
  winnerName: string;
  score: number;
  difficulty: Difficulty;
  numPlayers: number;
  date: string;
}


// FIX: Add LobbyState and OnlineMessage types to resolve import errors.
export interface LobbyState {
  roomId: string;
  hostId: string;
  players: Player[];
}

export type OnlineMessage =
  | { type: 'player_join_request'; payload: { playerId: string; playerName: string } }
  | { type: 'player_leave_request'; payload: { playerId: string } }
  | { type: 'lobby_update'; payload: { players: Player[]; hostId: string } }
  | { type: 'room_closed' };