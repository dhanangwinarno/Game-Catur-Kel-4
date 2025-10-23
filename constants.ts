
import { PlayerColor } from './types';

export const BOARD_SIZE = 9;
export const MAX_TURNS = 60;

export const PLAYER_COLOR_ORDER: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export const PLAYER_COLORS: Record<PlayerColor, { bg: string; text: string; border: string; ring: string; shadow: string }> = {
  red: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-700', ring: 'ring-red-300', shadow: 'shadow-red-500/50' },
  yellow: { bg: 'bg-yellow-400', text: 'text-gray-800', border: 'border-yellow-600', ring: 'ring-yellow-200', shadow: 'shadow-yellow-400/50' },
  green: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-800', ring: 'ring-green-300', shadow: 'shadow-green-600/50' },
  blue: { bg: 'bg-sky-500', text: 'text-white', border: 'border-sky-700', ring: 'ring-sky-300', shadow: 'shadow-sky-500/50' },
  purple: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-800', ring: 'ring-purple-300', shadow: 'shadow-purple-600/50' },
  orange: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-700', ring: 'ring-orange-300', shadow: 'shadow-orange-500/50' },
};