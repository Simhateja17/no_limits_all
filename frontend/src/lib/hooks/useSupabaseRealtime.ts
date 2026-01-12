/**
 * Supabase Realtime Hook
 * Replaces Socket.IO for real-time chat functionality
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { ChatMessage } from '@/components/chats/ChatSection';

interface UseSupabaseRealtimeOptions {
  roomId?: string;
  userId?: string;
  userName?: string;
  enabled?: boolean;
}

interface PresenceState {
  userId: string;
  userName: string;
  onlineAt: string;
}

export const useSupabaseRealtime = (options: UseSupabaseRealtimeOptions = {}) => {
  const { roomId, userId, userName, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messageCallbacksRef = useRef<((message: ChatMessage) => void)[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Subscribe to chat room
  useEffect(() => {
    if (!enabled || !roomId || !userId) {
      return;
    }

    console.log(`🟢 Subscribing to Supabase Realtime room: ${roomId}`);

    // Create channel for this room
    const channel = supabase.channel(`chat:${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Listen for new messages from database
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ChatMessage',
          filter: `chatRoomId=eq.${roomId}`,
        },
        async (payload) => {
          console.log('📨 New message from database:', payload);

          // Fetch complete message data with sender info
          const { data: message, error } = await supabase
            .from('ChatMessage')
            .select(`
              id,
              content,
              createdAt,
              status,
              attachmentUrl,
              attachmentType,
              senderId,
              sender:User!ChatMessage_senderId_fkey (
                id,
                name,
                avatar
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching message details:', error);
            return;
          }

          if (message && message.sender) {
            const transformedMessage: ChatMessage = {
              id: message.id,
              senderId: message.senderId,
              senderName: (message.sender as any).name || 'Unknown',
              senderAvatar: (message.sender as any).avatar || '/default-avatar.png',
              content: message.content,
              timestamp: new Date(message.createdAt).toISOString(),
              isFromUser: message.senderId === userId,
            };

            // Notify all message callbacks
            messageCallbacksRef.current.forEach((callback) => callback(transformedMessage));
          }
        }
      )
      // Track presence (online users)
      .on('presence', { event: 'sync' }, () => {
        const state: RealtimePresenceState<PresenceState> = channel.presenceState();
        const users = Object.keys(state).map((key) => {
          const presences = state[key];
          return presences[0]?.userId;
        }).filter(Boolean);

        console.log('👥 Online users:', users);
        setOnlineUsers(users as string[]);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', leftPresences);
      })
      // Listen for broadcast events (typing indicators)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        console.log('⌨️  Typing indicator:', payload);

        if (payload.userId !== userId) {
          setTypingUsers((prev) => ({
            ...prev,
            [payload.userId]: payload.isTyping,
          }));

          // Auto-clear typing after 3 seconds
          if (payload.isTyping && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((prev) => ({
              ...prev,
              [payload.userId]: false,
            }));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        console.log(`📡 Supabase channel status: ${status}`);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

          // Track presence
          await channel.track({
            userId,
            userName: userName || 'Unknown',
            onlineAt: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log(`🔴 Unsubscribing from room: ${roomId}`);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, roomId, userId, userName]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !roomId || !userId) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          userName: userName || 'Unknown',
          isTyping,
        },
      });
    },
    [roomId, userId, userName]
  );

  // Subscribe to new messages
  const onMessage = useCallback((callback: (message: ChatMessage) => void) => {
    messageCallbacksRef.current.push(callback);

    // Return unsubscribe function
    return () => {
      messageCallbacksRef.current = messageCallbacksRef.current.filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    sendTypingIndicator,
    onMessage,
  };
};
