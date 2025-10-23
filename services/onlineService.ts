import { OnlineMessage, Player } from '../types';

type MessageListener = (message: OnlineMessage) => void;

class OnlineService {
    private channel: BroadcastChannel | null = null;
    private listeners: Set<MessageListener> = new Set();
    private localPlayerId: string | null = null;
    private localPlayerName: string | null = null;
    private isHost: boolean = false;
    private playersInLobby: Player[] = [];

    private handleMessage = (event: MessageEvent) => {
        const message = event.data as OnlineMessage;

        // Host-specific logic
        if (this.isHost) {
            if (message.type === 'player_join_request') {
                const newPlayer: Player = { 
                    id: message.payload.playerId, 
                    name: message.payload.playerName, 
                    color: 'blue', // Placeholder color
                    isComputer: false, 
                    score: 0 
                };
                
                // Avoid adding duplicates
                if (!this.playersInLobby.some(p => p.id === newPlayer.id)) {
                    this.playersInLobby.push(newPlayer);
                }

                // Assign colors based on order
                const colors: Player['color'][] = ['red', 'blue', 'green', 'yellow'];
                this.playersInLobby.forEach((p, i) => {
                    p.color = colors[i];
                });
                
                // Broadcast the updated lobby state to everyone
                this.sendMessage({ 
                    type: 'lobby_update', 
                    payload: { players: this.playersInLobby, hostId: this.localPlayerId! } 
                });
            } else if (message.type === 'player_leave_request') {
                this.playersInLobby = this.playersInLobby.filter(p => p.id !== message.payload.playerId);
                 // Re-assign colors
                const colors: Player['color'][] = ['red', 'blue', 'green', 'yellow'];
                this.playersInLobby.forEach((p, i) => {
                    p.color = colors[i];
                });
                // Broadcast the updated lobby state
                this.sendMessage({
                    type: 'lobby_update',
                    payload: { players: this.playersInLobby, hostId: this.localPlayerId! }
                });
            }
        }
        
        // Notify all listeners
        this.listeners.forEach(listener => listener(message));
    };

    addListener(listener: MessageListener) {
        this.listeners.add(listener);
    }

    removeListener(listener: MessageListener) {
        this.listeners.delete(listener);
    }

    createRoom(playerId: string, playerName: string): string {
        const roomId = Math.random().toString(36).substr(2, 5).toUpperCase();
        this.isHost = true;
        this.localPlayerId = playerId;
        this.localPlayerName = playerName;

        const hostPlayer: Player = { id: playerId, name: playerName, color: 'red', isComputer: false, score: 0 };
        this.playersInLobby = [hostPlayer];

        this.channel = new BroadcastChannel(`tcc-game-${roomId}`);
        this.channel.onmessage = this.handleMessage;
        return roomId;
    }

    joinRoom(roomId: string, playerId: string, playerName: string) {
        this.isHost = false;
        this.localPlayerId = playerId;
        this.localPlayerName = playerName;
        this.channel = new BroadcastChannel(`tcc-game-${roomId}`);
        this.channel.onmessage = this.handleMessage;

        // Announce our arrival
        this.sendMessage({ type: 'player_join_request', payload: { playerId, playerName } });
    }

    leaveRoom() {
        if (this.channel && this.localPlayerId) {
            if (this.isHost) {
                // If the host leaves, the room is closed for everyone.
                this.sendMessage({ type: 'room_closed' });
            } else {
                // If a client leaves, they just notify the host.
                this.sendMessage({ type: 'player_leave_request', payload: { playerId: this.localPlayerId } });
            }
        }
        
        // Give a small delay for the message to be sent before closing the channel.
        setTimeout(() => {
            this.channel?.close();
            this.channel = null;
            this.isHost = false;
            this.localPlayerId = null;
            this.localPlayerName = null;
            this.playersInLobby = [];
        }, 100);
    }

    sendMessage(message: OnlineMessage) {
        this.channel?.postMessage(message);
    }
}

// Export a singleton instance
export const onlineService = new OnlineService();