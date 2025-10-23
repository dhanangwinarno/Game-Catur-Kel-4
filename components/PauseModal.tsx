import React from 'react';
import { playSound } from '../services/audioService';

interface PauseModalProps {
  onResume: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({ onResume }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="rounded-xl shadow-2xl p-8 max-w-sm w-full text-center bg-slate-800 border-2 border-sky-500">
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-6">Game Paused</h2>
        <button
          onClick={onResume}
          className="w-full px-4 py-3 text-xl font-bold rounded-lg shadow-md transition-all bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          Resume Game
        </button>
      </div>
    </div>
  );
};

export default PauseModal;
