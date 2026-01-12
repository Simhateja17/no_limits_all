import { useEffect, useRef, useState } from 'react';
import {
  initializeSocket,
  disconnectSocket,
  joinChatRoom,
  leaveChatRoom,
  sendTypingIndicator,
  onNewMessage,
  onTyping,
  onUserOnline,
  onUserOffline,
  removeListener,
  isSocketConnected,
} from '../socket';

interface UseSocketOptions {
  token?: string;
  autoConnect?: boolean;
}

interface TypingData {
  userId: string;
  roomId: string;
  isTyping: boolean;
  userName: string;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { token, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingData>>({});
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (!token || !autoConnect || socketInitialized.current) {
      return;
    }

    try {
      const socket = initializeSocket(token);
      socketInitialized.current = true;

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Set initial connection status
      setIsConnected(isSocketConnected());
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }

    return () => {
      disconnectSocket();
      socketInitialized.current = false;
      setIsConnected(false);
    };
  }, [token, autoConnect]);

  const joinRoom = (roomId: string) => {
    joinChatRoom(roomId);
  };

  const leaveRoom = (roomId: string) => {
    leaveChatRoom(roomId);
  };

  const emitTyping = (roomId: string, isTyping: boolean) => {
    sendTypingIndicator(roomId, isTyping);
  };

  const onMessage = (callback: (message: any) => void) => {
    onNewMessage(callback);
    return () => removeListener('chat:newMessage', callback);
  };

  const onTypingUpdate = (callback: (data: TypingData) => void) => {
    const handler = (data: TypingData) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return { ...prev, [data.userId]: data };
        } else {
          const { [data.userId]: _, ...rest } = prev;
          return rest;
        }
      });
      callback(data);
    };

    onTyping(handler);
    return () => removeListener('chat:typing', handler);
  };

  const onUserStatusChange = (
    onOnline?: (userId: string) => void,
    onOffline?: (userId: string) => void
  ) => {
    if (onOnline) {
      onUserOnline(({ userId }) => onOnline(userId));
    }
    if (onOffline) {
      onUserOffline(({ userId }) => onOffline(userId));
    }

    return () => {
      if (onOnline) removeListener('user:online');
      if (onOffline) removeListener('user:offline');
    };
  };

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    emitTyping,
    onMessage,
    onTypingUpdate,
    onUserStatusChange,
    typingUsers,
  };
};
