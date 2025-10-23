import React from 'react';

const RulesPanel: React.FC = () => {
  return (
    <div className="w-full flex-grow bg-black/40 rounded-lg shadow-md p-3 flex flex-col text-white">
      <h3 className="text-3xl font-bold text-gray-200 text-center border-b border-gray-600 pb-2 mb-2 flex-shrink-0">Rules of the Game</h3>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3 text-sm text-gray-300">
        
        <div>
            <h4 className="font-bold text-gray-100">Deck & Hand</h4>
            <ul className="list-disc list-inside space-y-1">
                <li>Each player has a personal deck of 18 cards (two of each card, values 1-9).</li>
                <li>Each player's deck is distinguished by their color (Red, Blue, Green, Yellow).</li>
                <li>Players hold a maximum of 3 cards. After playing a card, a new one is automatically drawn from their deck.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-gray-100">Gameplay</h4>
            <ul className="list-disc list-inside space-y-1">
                <li>The first player must place their card on the center tile (5,5).</li>
                <li>Players take turns in a clockwise order.</li>
                <li>Each subsequent card must be placed on a tile that is adjacent (horizontally, vertically, or diagonally) to any existing card.</li>
            </ul>
        </div>

        <div>
            <h4 className="font-bold text-gray-100">Stacking on Opponent's Cards</h4>
            <ul className="list-disc list-inside space-y-1">
                <li>You can place a card on top of an opponent's card if the tile is adjacent to any other card.</li>
                <li>The condition is that your card's value must be higher than the opponent's card you wish to stack on.</li>
                <li>You cannot stack on your own cards.</li>
            </ul>
        </div>

         <div>
            <h4 className="font-bold text-gray-100">Winning Conditions</h4>
            <ul className="list-disc list-inside space-y-1">
                <li><b>Instant Win:</b> The first player to get 4 of their cards in a row (horizontally, vertically, or diagonally) immediately wins the game.</li>
                <li><b>Score Win:</b> If all cards are played and there is no instant winner, the winner is determined by the highest score.</li>
                <li><b>Score</b> is calculated by summing the values of all of a player's cards on the board at the end of the game.</li>
            </ul>
          </div>

      </div>
    </div>
  );
};

export default RulesPanel;