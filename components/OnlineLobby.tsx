import React, { useState } from 'react';
import { LobbyState, Player } from '../types';
import { playSound } from '../services/audioService';
import { PLAYER_COLORS } from '../constants';

interface OnlineLobbyProps {
  lobbyState: LobbyState | null;
  playerId: string;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onStartGame: () => void;
  onExit: () => void;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ lobbyState, playerId, onCreateRoom, onJoinRoom, onStartGame, onExit }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [view, setView] = useState<'entry' | 'lobby'>(lobbyState ? 'lobby' : 'entry');
  const [nameError, setNameError] = useState(false);

  const isHost = lobbyState?.hostId === playerId;

  const handleCreate = () => {
    if (playerName.trim() === '') {
        setNameError(true);
        return;
    }
    playSound('click');
    onCreateRoom(playerName.trim());
    setView('lobby');
  };

  const handleJoin = () => {
    if (playerName.trim() === '' || roomIdToJoin.trim() === '') {
        setNameError(playerName.trim() === '');
        return;
    }
    playSound('click');
    onJoinRoom(roomIdToJoin.trim().toUpperCase(), playerName.trim());
    setView('lobby');
  };

  const handleCopyToClipboard = () => {
    if (!lobbyState) return;
    navigator.clipboard.writeText(lobbyState.roomId).then(() => {
        playSound('click');
        alert('Room ID copied to clipboard!');
    });
  };

  if (view === 'entry') {
    return (
      <div className="bg-sky-300/80 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-md transition-all duration-300 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Play Online</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="player-name" className="block text-gray-800 text-sm font-bold mb-1">
              Your Name
            </label>
            <input
              id="player-name"
              type="text"
              value={playerName}
              maxLength={15}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (e.target.value.trim() !== '') setNameError(false);
              }}
              className={`w-full px-4 py-2 text-lg font-semibold rounded-lg shadow-md border ${nameError ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'} focus:ring-2 focus:ring-sky-500 focus:outline-none`}
              autoFocus
            />
            {nameError && <p className="text-red-600 text-xs mt-1">Please enter your name.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleCreate} className="w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600">
              Create Room
            </button>
          </div>
          <div className="flex items-center gap-2">
            <hr className="flex-grow border-gray-400" />
            <span className="text-gray-600 font-semibold">OR</span>
            <hr className="flex-grow border-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomIdToJoin}
              maxLength={5}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              className="flex-grow w-full px-4 py-2 text-lg font-semibold rounded-lg shadow-md border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button onClick={handleJoin} className="px-4 py-2 text-lg font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600">
              Join
            </button>
          </div>
        </div>
        <button onClick={onExit} className="mt-6 text-gray-600 hover:text-gray-800 font-semibold w-full">
            ← Back to Main Menu
        </button>
      </div>
    );
  }

  return (
      <div className="bg-sky-300/80 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-md transition-all duration-300 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Lobby</h2>
        {lobbyState && (
            <div className="text-center mb-4">
                <span className="text-gray-700 font-semibold">Room ID:</span>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <strong className="text-2xl text-gray-800 tracking-widest">{lobbyState.roomId}</strong>
                    <button onClick={handleCopyToClipboard} title="Copy to Clipboard" className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        📋
                    </button>
                </div>
            </div>
        )}

        <h3 className="font-bold text-lg text-gray-700 mb-2">Players ({lobbyState?.players.length || 0}/4):</h3>
        <ul className="space-y-2 bg-white/50 p-3 rounded-lg min-h-[120px]">
            {lobbyState?.players.map((player) => {
                const theme = PLAYER_COLORS[player.color];
                return (
                    <li key={player.id} className={`flex items-center justify-between p-2 rounded-lg font-semibold ${theme.bg} ${theme.text}`}>
                        <span>{player.name}</span>
                        {lobbyState.hostId === player.id && <span className="text-xs font-bold bg-white/30 px-2 py-0.5 rounded-full">HOST</span>}
                    </li>
                );
            })}
        </ul>

        {isHost ? (
            <button 
                onClick={onStartGame}
                disabled={!lobbyState || lobbyState.players.length < 2}
                className="mt-6 w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Start Game ({lobbyState?.players.length}/2-4)
            </button>
        ) : (
            <p className="mt-6 text-center text-gray-700 font-semibold animate-pulse">Waiting for the host to start the game...</p>
        )}
         <button onClick={onExit} className="mt-4 text-gray-600 hover:text-gray-800 font-semibold w-full">
            ← Leave Room
        </button>
      </div>
  );
};

export default OnlineLobby;
