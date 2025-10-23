import React, { useRef, useEffect, useState } from 'react';
import { HistoryEntry } from '../types';
import { PLAYER_COLORS } from '../constants';

interface HistoryLogProps {
  history: HistoryEntry[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copy');
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    const prevHistoryLength = useRef(history.length);

    useEffect(() => {
        const logContainer = logContainerRef.current;
        if (logContainer) {
            // Only auto-scroll if the user hasn't scrolled up manually, or if it's a new entry
            if (!isUserScrolledUp || history.length > prevHistoryLength.current) {
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }
        prevHistoryLength.current = history.length;
    }, [history, isUserScrolledUp]);

    const handleScroll = () => {
        const logContainer = logContainerRef.current;
        if (logContainer) {
            const isAtBottom = logContainer.scrollHeight - logContainer.scrollTop <= logContainer.clientHeight + 10; // 10px tolerance
            setIsUserScrolledUp(!isAtBottom);
        }
    };

    const scrollToBottom = () => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTo({
                top: logContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    const getCapturedCardColor = (color: HistoryEntry['playerColor']) => {
       const theme = PLAYER_COLORS[color];
       return `${theme.bg} ${theme.text}`;
    }

    const formatHistoryForExport = (): string => {
        if (history.length === 0) return "No moves made yet.";
        
        return history.map(entry => {
            if (entry.action === 'placed') {
                let log = `Turn ${entry.turn}: ${entry.playerName} placed a ${entry.cardValue} at (${entry.position!.x + 1}, ${entry.position!.y + 1}).`;
                if (entry.captured) {
                    log += ` Captured a ${entry.captured.value} from ${entry.captured.name}.`;
                }
                return log;
            } else {
                return `Turn ${entry.turn}: ${entry.playerName} passed their turn.`;
            }
        }).join('\n');
    };

    const handleCopy = () => {
        const historyText = formatHistoryForExport();
        navigator.clipboard.writeText(historyText).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy'), 2000);
        }).catch(err => {
            console.error('Failed to copy history:', err);
            alert('Could not copy history to clipboard.');
        });
    };

    const handleSave = () => {
        const historyText = formatHistoryForExport();
        const blob = new Blob([historyText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tactical-card-conquest-history.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


  return (
    <div className="w-full flex-grow bg-black/40 rounded-lg shadow-md p-3 flex flex-col text-white">
      <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-2 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-200">Game History</h3>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleCopy}
                className="px-2 py-1 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-400"
                disabled={history.length === 0}
            >
                {copyButtonText}
            </button>
            <button 
                onClick={handleSave}
                className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                disabled={history.length === 0}
            >
                Save
            </button>
        </div>
      </div>
      <div className="flex-grow min-h-0 relative">
        <div ref={logContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto pr-2 space-y-2 text-sm history-log-scroll">
            {history.length === 0 ? (
                <p className="text-gray-400 text-center mt-4">No moves made yet.</p>
            ) : (
                history.map((entry, index) => {
                    const playerTheme = PLAYER_COLORS[entry.playerColor];
                    return (
                        <div key={`${entry.turn}-${index}`} className="p-2 bg-gray-800/60 rounded text-gray-300">
                            {entry.action === 'placed' ? (
                                <>
                                    <p className="leading-relaxed">
                                        <span className="font-semibold text-gray-200">Turn {entry.turn}:</span>{' '}
                                        <span className={`inline-block align-middle px-2 py-0.5 rounded text-xs font-bold ${playerTheme.bg} ${playerTheme.text}`}>{entry.playerName}</span>
                                        {' placed a '}
                                        <strong className="text-white">{entry.cardValue}</strong>
                                        {' at '}
                                        <span>({entry.position!.x + 1}, {entry.position!.y + 1}).</span>
                                    </p>
                                    {entry.captured && (
                                        <p className="pl-2 mt-1 text-xs">
                                            <span className="font-semibold text-gray-400">↳ Captured a</span>{' '}
                                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getCapturedCardColor(entry.captured.color)}`}>
                                                {entry.captured.value}
                                            </span>
                                            {' from '}
                                            <span className={`inline-block align-middle px-2 py-0.5 rounded text-xs font-bold ${PLAYER_COLORS[entry.captured.color].bg} ${PLAYER_COLORS[entry.captured.color].text}`}>{entry.captured.name}</span>
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p>
                                    <span className="font-semibold text-gray-200">Turn {entry.turn}:</span>{' '}
                                    <span className={`inline-block align-middle px-2 py-0.5 rounded text-xs font-bold ${playerTheme.bg} ${playerTheme.text}`}>{entry.playerName}</span>
                                    {' passed their turn.'}
                                </p>
                            )}
                        </div>
                    )
                })
            )}
        </div>
        {isUserScrolledUp && (
            <button
                onClick={scrollToBottom}
                className="absolute bottom-2 right-2 px-3 py-1 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-500 transition-all text-sm font-semibold animate-fade-in"
                title="Scroll to latest move"
            >
                ↓ Scroll Down
            </button>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;