import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface BidActivity {
  userBidId: number;
  userId: number;
  userName: string;
  bidId: number;
  diamondId: number;
  diamondName: string;
  amount: number;
  timestamp: string;
  updatedAt: string;
  action: 'placed' | 'updated';
}

interface UseWebSocketOptions {
  onBidActivity?: (activity: BidActivity) => void;
  enabled?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { onBidActivity, enabled = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found for WebSocket');
      return;
    }

    // Get WebSocket URL from environment or derive from API base URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    // Extract base URL (remove /api if present)
    const wsUrl = import.meta.env.VITE_WS_URL || apiBaseUrl.replace('/api', '') || 'http://localhost:5000';

    // Initialize socket connection
    const newSocket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // Listen for bid activity updates
    if (onBidActivity) {
      newSocket.on('new-bid-activity', (activity: BidActivity) => {
        onBidActivity(activity);
      });
    }

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.off('new-bid-activity');
        newSocket.disconnect();
      }
    };
  }, [enabled, onBidActivity]);

  return { socket, connected };
};
