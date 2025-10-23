import React, { useState, useEffect } from 'react';
import { playSound } from '../services/audioService';

const GameStartAnimation: React.FC = () => {
    const [count, setCount] = useState(3);

    useEffect(() => {
        playSound('gameStartStinger');
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 800);
            return () => clearTimeout(timer);
        }
    }, [count]);

    const display = count > 0 ? count : 'Start!';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
            <div key={count} className="text-white text-9xl font-extrabold animate-zoom-in-out" style={{ textShadow: '0 0 25px rgba(255,255,255,0.8)' }}>
                {display}
            </div>
            <style>{`
                @keyframes zoom-in-out {
                    0% { transform: scale(0.5); opacity: 0; }
                    25% { transform: scale(1.1); opacity: 1; }
                    75% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.5); opacity: 0; }
                }
                .animate-zoom-in-out {
                    animation: zoom-in-out 0.8s ease-in-out;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default GameStartAnimation;