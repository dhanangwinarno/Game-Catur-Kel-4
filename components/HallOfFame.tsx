import React, { useState, useEffect } from 'react';
import { GameRecord } from '../types';
import { playSound } from '../services/audioService';

interface HallOfFameProps {
  onBack: () => void;
}

const HallOfFame: React.FC<HallOfFameProps> = ({ onBack }) => {
  const [records, setRecords] = useState<GameRecord[]>([]);

  useEffect(() => {
    playSound('applause'); // Play applause sound on open

    try {
      const storedRecords = localStorage.getItem('tacticalCardConquest_hallOfFame');
      if (storedRecords) {
        const allRecords: GameRecord[] = JSON.parse(storedRecords);
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const eligibleRecords = allRecords
          .filter(record => {
            const recordDate = new Date(record.date);
            return record.score >= 40 && recordDate > oneMonthAgo;
          })
          .slice(0, 15); // Apply max 15 players limit

        setRecords(eligibleRecords);
      }
    } catch (e) {
      console.error("Failed to load high scores:", e);
    }
  }, []);

  return (
    <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-6 shadow-lg w-full max-w-2xl transition-all duration-300 animate-fade-in text-white">
      <h2 className="text-3xl font-bold text-white text-center">🏆 Hall of Fame 🏆</h2>
      <p className="text-center italic text-gray-400 mb-4">we are the best</p>
      <div className="max-h-[60vh] overflow-y-auto history-log-scroll pr-2">
        {records.length > 0 ? (
          <table className="w-full text-left table-auto">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Player</th>
                <th className="p-3 text-right">Score</th>
                <th className="p-3 text-center">Difficulty</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-3 font-bold">{index + 1}</td>
                  <td className="p-3 font-bold text-yellow-300">{record.winnerName}</td>
                  <td className="p-3 text-right font-semibold">{record.score}</td>
                  <td className="p-3 text-center">{record.difficulty}</td>
                  <td className="p-3 text-sm text-gray-400">{new Date(record.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 py-8">No records with scores 40 or over yet. Win a high-scoring game!</p>
        )}
      </div>
      <button
        onClick={onBack}
        className="mt-6 w-full px-4 py-3 text-lg font-semibold rounded-lg shadow-md transition-all bg-sky-500 text-white hover:bg-sky-600"
      >
        ← Back to Main Menu
      </button>
    </div>
  );
};

export default HallOfFame;