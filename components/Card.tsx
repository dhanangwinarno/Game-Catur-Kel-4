import React from 'react';
import { PlayerColor } from '../types';
import { PLAYER_COLORS } from '../constants';

interface CardProps {
    value: number;
    color: PlayerColor;
    isSelected?: boolean;
    onClick?: () => void;
    isPlaced?: boolean;
    isPlayerTurn?: boolean;
    id?: string;
    isNew?: boolean;
}

const Card: React.FC<CardProps> = ({ value, color, isSelected = false, onClick, isPlaced = false, isPlayerTurn = true, id, isNew = false }) => {
    const colorTheme = PLAYER_COLORS[color];

    const sizeClasses = isPlaced ? 'w-full h-full' : 'w-10 h-16 md:w-12 md:h-18';
    const cursorClass = onClick && isPlayerTurn ? 'cursor-pointer' : 'cursor-default';
    const transitionClasses = 'transition-all duration-300 ease-in-out';
    const shadowClasses = `${colorTheme.shadow} shadow-lg`;

    const selectedClasses = isSelected ? `ring-4 ${colorTheme.ring} scale-110 -translate-y-4` : 'hover:scale-105 hover:-translate-y-2';
    const animationClasses = isNew ? 'animate-draw-card' : '';

    return (
        <div
            id={id}
            onClick={onClick}
            className={`${sizeClasses} ${cursorClass} ${transitionClasses} ${!isPlaced ? (isPlayerTurn ? selectedClasses : '') : ''} rounded-lg flex items-center justify-center ${colorTheme.bg} ${shadowClasses} ${animationClasses}`}
        >
            <span className={`text-2xl md:text-3xl font-black ${colorTheme.text} drop-shadow-sm`}>
                {value}
            </span>
        </div>
    );
};

export default Card;