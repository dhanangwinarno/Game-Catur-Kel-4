import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  sfxVolume: number;
  musicVolume: number;
  onSfxVolumeChange: (level: number) => void;
  onMusicVolumeChange: (level: number) => void;
}

const PauseModal: React.FC<PauseModalProps> = ({ onResume, sfxVolume, musicVolume, onSfxVolumeChange, onMusicVolumeChange }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="rounded-xl shadow-2xl p-8 max-w-sm w-full text-center bg-slate-800 border-2 border-sky-500">
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-4">Game Paused</h2>
        
        <div className="my-6 space-y-4 text-left">
            <div>
                <label htmlFor="music-volume" className="block text-white text-md font-bold mb-2 flex justify-between items-center">
                    <span>🎵 Music Volume</span>
                    <span>{Math.round(musicVolume * 100)}%</span>
                </label>
                <input
                    id="music-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <div>
                <label htmlFor="sfx-volume" className="block text-white text-md font-bold mb-2 flex justify-between items-center">
                    <span>🔊 SFX Volume</span>
                    <span>{Math.round(sfxVolume * 100)}%</span>
                </label>
                <input
                    id="sfx-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>
        </div>

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