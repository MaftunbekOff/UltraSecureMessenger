
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      auth: {
        token: 'user-token', // Get from auth context
      },
      transports: ['websocket', 'polling'],
      compression: true,
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new-message', (message) => {
      // Update React Query cache
      queryClient.setQueryData(
        ['/api/chats', message.chatId, 'messages'],
        (oldData: any) => oldData ? [message, ...oldData] : [message]
      );
    });

    newSocket.on('user-typing', ({ userId, chatId }) => {
      // Handle typing indicators
    });

    newSocket.on('connect_error', () => {
      if (reconnectAttempts.current < 5) {
        setTimeout(() => {
          newSocket.connect();
          reconnectAttempts.current++;
        }, Math.pow(2, reconnectAttempts.current) * 1000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [queryClient]);

  return { socket, isConnected };
}
