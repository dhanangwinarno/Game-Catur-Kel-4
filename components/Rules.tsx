import React from 'react';

interface RulesProps {
  onClose: () => void;
}

const Rules: React.FC<RulesProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in-fast p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 border-b pb-2">Game Rules</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="text-xl font-semibold mb-1">Objective</h3>
            <p>The goal is to have the most cards of your color on the board when the game ends. The game ends when all cards from all players have been played.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">Gameplay</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Each player starts with a deck of cards and a hand of 5 cards.</li>
              <li>On your turn, select a card from your hand and place it on any empty square on the board.</li>
              <li>After placing a card, you draw a new one from your deck, if available.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">Capturing Cards</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>If you place a card next to an opponent's card (up, down, left, or right) and your card's value is higher, you capture the opponent's card.</li>
              <li>A captured card is flipped to your color but keeps its original value.</li>
              <li>You can capture multiple cards in a single move if your card is adjacent to several weaker opponent cards.</li>
            </ul>
          </div>
           <div>
            <h3 className="text-xl font-semibold mb-1">Winning</h3>
            <p>Once all cards are played, the player with the most cards of their color on the board is declared the winner!</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Rules;
