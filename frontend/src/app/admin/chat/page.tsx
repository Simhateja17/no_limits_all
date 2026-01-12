'use client';

import { DashboardLayout } from '@/components/layout';
import { ContactsList, ChatSection } from '@/components/chats';
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

// Extended contact with clientId for room creation
interface ExtendedContact extends Contact {
  clientId?: string;
}

// Pagination state
interface PaginationState {
  nextCursor: string | null;
  hasMore: boolean;
  isLoading: boolean;
}

// Message cache per room (WhatsApp-like instant switching)
interface MessageCache {
  messages: OptimisticMessage[];
  pagination: PaginationState;
  lastFetched: number;
}

export default function AdminChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [contacts, setContacts] = useState<ExtendedContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ExtendedContact | null>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    nextCursor: null,
    hasMore: false,
    isLoading: false,
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Message cache - stores messages per room for instant switching
  const messageCacheRef = useRef<Map<string, MessageCache>>(new Map());

  // Initialize Supabase Realtime for selected room
  const { isConnected, typingUsers, sendTypingIndicator, onMessage, onlineUsers } =
    useSupabaseRealtime({
      roomId: selectedContact?.id,
      userId: user?.id,
      userName: user?.name || user?.email,
      enabled: !!selectedContact && isAuthenticated,
    });

  // Determine if someone is typing (excluding current user)
  const isTyping = Object.values(typingUsers).some((typing) => typing);

  // Log connection status
  useEffect(() => {
    console.log('🔌 Supabase Realtime connection status:', isConnected);
    console.log('👥 Online users:', onlineUsers);
  }, [isConnected, onlineUsers]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Fetch all clients as contacts on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('=== FETCHING CLIENTS FOR CHAT ===');
        setIsLoading(true);

        // Fetch all clients
        const response = await api.get('/clients');
        console.log('Clients response:', response.data);

        if (response.data.success && response.data.data) {
          const clients = response.data.data;
          console.log(`Found ${clients.length} clients`);

          // Transform clients to contacts format
          const clientContacts: ExtendedContact[] = clients.map((client: any) => ({
            id: client.chatRoomId || `client-${client.id}`, // Use existing room ID if available
            clientId: client.id,
            name: client.companyName || client.name || client.user?.name || 'Unknown Client',
            avatar: client.user?.avatar || '/default-avatar.png',
            lastMessage: client.lastMessage || '',
            lastMessageDate: client.lastMessageDate || client.updatedAt || new Date().toISOString(),
            unreadCount: client.unreadCount || 0,
            status: 'none' as const,
            isOnline: false,
          }));

          setContacts(clientContacts);
          console.log('Transformed contacts:', clientContacts);

          // Select first contact by default
          if (clientContacts.length > 0 && !selectedContact) {
            console.log('Selecting first contact:', clientContacts[0]);
            // Don't auto-select, let user choose
          }
        }
      } catch (error: any) {
        console.error('❌ Error fetching clients:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      } finally {
        setIsLoading(false);
        console.log('=== FETCH CLIENTS COMPLETE ===');
      }
    };

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchClients();
    }
  }, [isAuthenticated, user]);

  // Handle contact selection - get or create chat room
  const handleSelectContact = async (contact: Contact) => {
    const extContact = contact as ExtendedContact;
    console.log('=== SELECTING CONTACT ===', extContact);

    // ✅ INSTANT SWITCH: Update UI immediately for WhatsApp-like experience
    setSelectedContact(extContact);

    // If this contact already has a valid room ID (not a client-* prefix), we're done
    // The useEffect will handle fetching messages with cache check
    if (extContact.id && !extContact.id.startsWith('client-')) {
      return;
    }

    // Otherwise, we need to get or create the chat room first
    if (extContact.clientId) {
      try {
        console.log('Getting/creating chat room for client:', extContact.clientId);
        setIsLoadingMessages(true);
        
        const response = await api.post(`/chat/clients/${extContact.clientId}/room`);

        if (response.data.success) {
          const roomId = response.data.data.id;
          console.log('Got room ID:', roomId);

          // Update the contact with the real room ID
          const updatedContact: ExtendedContact = {
            ...extContact,
            id: roomId,
          };

          // Update contacts list with real room ID
          setContacts(prev =>
            prev.map(c =>
              c.clientId === extContact.clientId
                ? { ...c, id: roomId }
                : c
            )
          );

          // Update selected contact with room ID - this will trigger useEffect to fetch messages
          setSelectedContact(updatedContact);
        }
      } catch (error) {
        console.error('Error getting/creating chat room:', error);
        setIsLoadingMessages(false);
      }
    }
  };

  // Fetch messages when contact is selected (with caching for instant switching)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact || selectedContact.id.startsWith('client-')) {
        // Clear messages when no contact is selected
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      const roomId = selectedContact.id;
      const cache = messageCacheRef.current.get(roomId);
      const CACHE_TTL = 30000; // 30 seconds cache validity

      // ALWAYS check cache first and load immediately if available
      if (cache && cache.messages.length > 0) {
        console.log('📦 Loading cached messages instantly for room:', roomId);
        setMessages(cache.messages);
        setPagination(cache.pagination);
        setIsLoadingMessages(false);
        
        // If cache is fresh enough, don't refetch
        if (Date.now() - cache.lastFetched < CACHE_TTL) {
          console.log('✅ Cache is fresh, no refetch needed');
          return;
        }
        // Cache exists but stale - refresh in background without showing loading
        console.log('🔄 Cache stale, refreshing in background...');
      } else {
        // No cache - show loading but DON'T clear existing messages yet
        console.log('❌ No cache found, fetching messages...');
        setIsLoadingMessages(true);
        setPagination({ nextCursor: null, hasMore: false, isLoading: false });
      }

      try {
        const response = await api.get(`/chat/rooms/${roomId}/messages?limit=50`);

        if (response.data.success) {
          const newMessages = response.data.data.map((msg: ChatMessage) => ({ ...msg, status: 'sent' }));
          const newPagination = {
            nextCursor: response.data.pagination?.nextCursor || null,
            hasMore: response.data.pagination?.hasMore || false,
            isLoading: false,
          };

          // Update cache
          messageCacheRef.current.set(roomId, {
            messages: newMessages,
            pagination: newPagination,
            lastFetched: Date.now(),
          });

          // Only update state if this room is still selected
          if (selectedContact?.id === roomId) {
            setMessages(newMessages);
            setPagination(newPagination);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        // Only clear messages if there was no cache
        if (!cache) {
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedContact]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedContact || !pagination.nextCursor || pagination.isLoading) return;

    const roomId = selectedContact.id;

    try {
      setPagination(prev => ({ ...prev, isLoading: true }));
      
      const response = await api.get(
        `/chat/rooms/${roomId}/messages?cursor=${pagination.nextCursor}&limit=50`
      );

      if (response.data.success) {
        const olderMessages = response.data.data.map((msg: ChatMessage) => ({ ...msg, status: 'sent' }));
        const newPagination = {
          nextCursor: response.data.pagination?.nextCursor || null,
          hasMore: response.data.pagination?.hasMore || false,
          isLoading: false,
        };

        // Update state
        setMessages(prev => [...olderMessages, ...prev]);
        setPagination(newPagination);

        // Update cache with all messages
        const cache = messageCacheRef.current.get(roomId);
        if (cache) {
          messageCacheRef.current.set(roomId, {
            messages: [...olderMessages, ...cache.messages],
            pagination: newPagination,
            lastFetched: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setPagination(prev => ({ ...prev, isLoading: false }));
    }
  }, [selectedContact, pagination.nextCursor, pagination.isLoading]);

  // Update contact online status when online users change
  useEffect(() => {
    setContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        isOnline: onlineUsers.includes(contact.id),
      }))
    );
  }, [onlineUsers]);

  // Listen for new messages via Supabase Realtime
  useEffect(() => {
    if (!selectedContact || !isConnected || selectedContact.id.startsWith('client-')) {
      return;
    }

    console.log('📡 Setting up message listener for room:', selectedContact.id);

    const unsubscribe = onMessage((message: ChatMessage) => {
      console.log('📨 New message received via Supabase:', message);

      // Safety check: ensure we're still on the same room
      // Messages are already filtered by room in the hook, so this is just a safety check
      if (!selectedContact) {
        return;
      }

      const roomId = selectedContact.id;
      const newMessage: OptimisticMessage = { ...message, status: 'sent' };

      setMessages((prev) => {
        // Check if this is our optimistic message being confirmed
        const tempIndex = prev.findIndex(
          (msg) => msg.tempId && msg.content === message.content && msg.senderId === message.senderId
        );

        let updatedMessages: OptimisticMessage[];

        if (tempIndex !== -1) {
          // Replace optimistic message with real one
          updatedMessages = [...prev];
          updatedMessages[tempIndex] = newMessage;
          console.log('✅ Replaced optimistic message with real one');
        } else if (prev.some((msg) => msg.id === message.id)) {
          // Message already exists
          console.log('⚠️ Message already exists, skipping');
          return prev;
        } else {
          updatedMessages = [...prev, newMessage];
          console.log('➕ Added new message to list');
        }

        // Update cache with new message
        const cache = messageCacheRef.current.get(roomId);
        if (cache) {
          messageCacheRef.current.set(roomId, {
            ...cache,
            messages: updatedMessages,
            lastFetched: Date.now(),
          });
        }

        return updatedMessages;
      });

      // Update contact list to show latest message
      setContacts((prev) =>
        prev.map((contact) => {
          if (contact.id === selectedContact?.id) {
            return {
              ...contact,
              lastMessage: message.content,
              lastMessageDate: message.timestamp,
            };
          }
          return contact;
        })
      );
    });

    return unsubscribe;
  }, [selectedContact, isConnected, onMessage]);

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
    if (!selectedContact || !user || selectedContact.id.startsWith('client-')) return;

    // Generate temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      senderId: user.id,
      senderName: user.name || 'Admin',
      senderAvatar: '/imageofchat.png',
      content,
      timestamp: new Date().toISOString(),
      isFromUser: true,
      status: 'pending',
    };

    // Immediately add message to UI (optimistic update)
    setMessages((prev) => {
      const updated = [...prev, optimisticMessage];
      
      // Update cache with optimistic message
      const cache = messageCacheRef.current.get(selectedContact.id);
      if (cache) {
        messageCacheRef.current.set(selectedContact.id, {
          ...cache,
          messages: updated,
          lastFetched: Date.now(),
        });
      }
      
      return updated;
    });

    // Stop typing indicator
    sendTypingIndicator(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      const response = await api.post(`/chat/rooms/${selectedContact.id}/messages`, {
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

        // Update contact's last message
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === selectedContact.id
              ? {
                  ...contact,
                  lastMessage: content,
                  lastMessageDate: new Date().toISOString(),
                }
              : contact
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

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
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
        {/* Contacts List */}
        <ContactsList
          contacts={contacts}
          selectedContactId={selectedContact?.id}
          onSelectContact={handleSelectContact}
        />

        {/* Chat Section */}
        <ChatSection
          contact={selectedContact}
          messages={isLoadingMessages ? [] : messages}
          currentUserId={user?.id || 'admin'}
          currentUserName={user?.name || 'Admin'}
          currentUserAvatar={'/imageofchat.png'}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onLoadMore={loadMoreMessages}
          hasMoreMessages={pagination.hasMore}
          isLoadingMore={pagination.isLoading}
          isLoadingMessages={isLoadingMessages}
          isTyping={isTyping}
          typingUser={
            isTyping && selectedContact
              ? { name: selectedContact.name, avatar: selectedContact.avatar }
              : undefined
          }
        />
      </div>
    </DashboardLayout>
  );
}
