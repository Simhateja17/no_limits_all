'use client';

import { DashboardLayout } from '@/components/layout';
import { ChatSection } from '@/components/chats';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import type { Contact } from '@/components/chats/ContactsList';
import type { ChatMessage } from '@/components/chats/ChatSection';

// Extended message type with status for optimistic updates
interface OptimisticMessage extends ChatMessage {
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  tempId?: string;
}

// Admin contact for client chat
const adminContact: Contact = {
  id: 'admin',
  name: 'Support',
  avatar: '',
  lastMessage: '',
  lastMessageDate: new Date().toISOString(),
  isOnline: true,
};

// Pagination state
interface PaginationState {
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
}

export default function ClientChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    nextCursor: null,
    hasMore: false,
    isLoading: false,
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase Realtime for the room
  const { isConnected, typingUsers, sendTypingIndicator, onMessage, onlineUsers } =
    useSupabaseRealtime({
      roomId: roomId || undefined,
      userId: user?.id,
      userName: user?.name || user?.email,
      enabled: !!roomId && isAuthenticated,
    });

  // Determine if someone is typing (excluding current user)
  const isTyping = Object.values(typingUsers).some((typing) => typing);

  // Log connection status
  useEffect(() => {
    console.log('🔌 Supabase Realtime connection status:', isConnected);
  }, [isConnected]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'CLIENT') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Get or create chat room on mount
  useEffect(() => {
    const initializeChatRoom = async () => {
      try {
        setIsLoading(true);
        // Get current user's chat room
        const roomResponse = await api.get('/chat/my-room');
        if (roomResponse.data.success) {
          const { roomId: fetchedRoomId } = roomResponse.data.data;
          setRoomId(fetchedRoomId);

          // Fetch messages for this room with pagination
          const messagesResponse = await api.get(`/chat/rooms/${fetchedRoomId}/messages?limit=50`);
          if (messagesResponse.data.success) {
            setMessages(messagesResponse.data.data.map((msg: ChatMessage) => ({ ...msg, status: 'sent' })));
            
            // Set pagination info
            if (messagesResponse.data.pagination) {
              setPagination({
                nextCursor: messagesResponse.data.pagination.nextCursor,
                hasMore: messagesResponse.data.pagination.hasMore,
                isLoading: false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing chat room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'CLIENT') {
      initializeChatRoom();
    }
  }, [isAuthenticated, user]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !pagination.nextCursor || pagination.isLoading) return;

    try {
      setPagination(prev => ({ ...prev, isLoading: true }));
      
      const response = await api.get(
        `/chat/rooms/${roomId}/messages?cursor=${pagination.nextCursor}&limit=50`
      );

      if (response.data.success) {
        // Prepend older messages to the beginning
        setMessages(prev => [
          ...response.data.data.map((msg: ChatMessage) => ({ ...msg, status: 'sent' })),
          ...prev,
        ]);
        
        setPagination({
          nextCursor: response.data.pagination?.nextCursor || null,
          hasMore: response.data.pagination?.hasMore || false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setPagination(prev => ({ ...prev, isLoading: false }));
    }
  }, [roomId, pagination.nextCursor, pagination.isLoading]);

  // Listen for new messages via Supabase Realtime
  useEffect(() => {
    if (!roomId || !isConnected) {
      return;
    }

    console.log('📡 Setting up message listener for room:', roomId);

    const unsubscribe = onMessage((message: ChatMessage) => {
      console.log('📨 New message received via Supabase:', message);

      setMessages((prev) => {
        // Check if this is our optimistic message being confirmed
        const tempIndex = prev.findIndex(
          (msg) => msg.tempId && msg.content === message.content && msg.senderId === message.senderId
        );

        if (tempIndex !== -1) {
          // Replace optimistic message with real one
          const updated = [...prev];
          updated[tempIndex] = { ...message, status: 'sent' };
          return updated;
        }

        // Check if message already exists to avoid duplicates
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }

        return [...prev, { ...message, status: 'sent' }];
      });
    });

    return unsubscribe;
  }, [roomId, isConnected, onMessage]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    sendTypingIndicator(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  // Optimistic message sending - instant feedback
  const handleSendMessage = async (content: string) => {
    if (!roomId || !user) return;

    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      senderId: user.id,
      senderName: user.name || 'You',
      senderAvatar: user.avatar || '/imageofchat.png',
      content,
      timestamp: new Date().toISOString(),
      isFromUser: true,
      status: 'pending',
    };

    // Immediately add message to UI (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage]);

    // Stop typing indicator
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const response = await api.post(`/chat/rooms/${roomId}/messages`, {
        content,
      });

      if (response.data.success) {
        // Update the optimistic message with real data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId
              ? { ...response.data.data, status: 'sent' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId ? { ...msg, status: 'error' } : msg
        )
      );
    }
  };

  if (!isAuthenticated || user?.role !== 'CLIENT') {
    return null;
  }

  return (
    <DashboardLayout>
      <div
        className="flex w-full"
        style={{
          height: 'calc(100vh - 64px)',
          background: '#FFFFFF',
        }}
      >
        {/* Full width Chat Section with Admin */}
        <ChatSection
          contact={adminContact}
          messages={isLoading ? [] : messages}
          currentUserId={user?.id || 'client'}
          currentUserName={user?.name || 'You'}
          currentUserAvatar={user?.avatar || '/imageofchat.png'}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onLoadMore={loadMoreMessages}
          hasMoreMessages={pagination.hasMore}
          isLoadingMore={pagination.isLoading}
          isLoadingMessages={isLoading}
          isTyping={isTyping}
          typingUser={
            isTyping
              ? { name: 'Support', avatar: '' }
              : undefined
          }
          showCreateTask={false}
        />
      </div>
    </DashboardLayout>
  );
}
