import React, { useState, useEffect, useRef } from 'react';
import { Card as CardType, Player, SelectedCard } from '../types';
import Card from './Card';
import { playSound } from '../services/audioService';

interface PlayerHandProps {
    hand: CardType[];
    player: Player;
    selectedCard: SelectedCard | null;
    onSelectCard: (card: SelectedCard | null) => void;
    isPlayerTurn: boolean;
    onPass: () => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ hand, player, selectedCard, onSelectCard, isPlayerTurn, onPass }) => {
    const [newlyAddedCardId, setNewlyAddedCardId] = useState<string | null>(null);
    const prevHandMapRef = useRef<Map<string, CardType[]>>(new Map());

    useEffect(() => {
        const prevHand = prevHandMapRef.current.get(player.id) || [];
        
        // This logic runs only if the hand has been updated for the currently displayed player
        if (hand.length > 0 && prevHand.length === hand.length) {
            const prevHandIds = new Set(prevHand.map(c => c.id));
            const newCard = hand.find(c => !prevHandIds.has(c.id));

            if (newCard) {
                setNewlyAddedCardId(newCard.id);
                // Clear the animation state after the animation completes
                const timer = setTimeout(() => setNewlyAddedCardId(null), 600);
                return () => clearTimeout(timer);
            }
        }
        
        // Update the stored hand for the current player for the next comparison
        prevHandMapRef.current.set(player.id, hand);
    }, [hand, player.id]);
    
    const handleCardClick = (index: number, value: number) => {
        if (!isPlayerTurn) return;
        playSound('click');
        if (selectedCard && selectedCard.handIndex === index) {
            onSelectCard(null); // Deselect
        } else {
            onSelectCard({ handIndex: index, value });
        }
    };
    
    return (
        <div>
            <h3 className="text-center font-bold text-lg mb-2 text-white drop-shadow-md">{player.isComputer ? "Comp's Hand" : "Your Hand"}</h3>
            <div className="flex justify-center items-end gap-2 h-28">
                {hand.map((card, index) => (
                    <Card 
                        key={card.id}
                        id={`player-hand-card-${index}`}
                        value={card.value}
                        color={player.color}
                        isSelected={selectedCard?.handIndex === index}
                        onClick={() => handleCardClick(index, card.value)}
                        isPlayerTurn={isPlayerTurn}
                        isNew={card.id === newlyAddedCardId}
                    />
                ))}
            </div>
             {isPlayerTurn && hand.length > 0 && (
                <div className="mt-4 text-center">
                    <button
                        onClick={onPass}
                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                    >
                        Pass Turn
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayerHand;