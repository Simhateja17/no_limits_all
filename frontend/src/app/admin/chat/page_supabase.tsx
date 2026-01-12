'use client';

import { DashboardLayout } from '@/components/layout';
import { ContactsList, ChatSection } from '@/components/chats';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSupabaseRealtime } from '@/lib/hooks/useSupabaseRealtime';
import type { Contact } from '@/components/chats/ContactsList';
import type { ChatMessage } from '@/components/chats/ChatSection';

export default function AdminChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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

  // Fetch contacts on mount
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        console.log('=== FETCHING CONTACTS ===');
        setIsLoading(true);

        const response = await api.get('/chat/rooms');
        console.log('API Response:', response.data);

        if (response.data.success) {
          const contactsData = response.data.data;
          console.log(`Success! Loaded ${contactsData.length} contacts`);

          // Update online status from Supabase-Realtime
          const updatedContacts = contactsData.map((contact: Contact) => ({
            ...contact,
            isOnline: onlineUsers.includes(contact.id),
          }));

          setContacts(updatedContacts);

          // Select first contact by default
          if (updatedContacts.length > 0 && !selectedContact) {
            setSelectedContact(updatedContacts[0]);
          }
        }
      } catch (error: any) {
        console.error('❌ Error fetching chat rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchContacts();
    }
  }, [isAuthenticated, user]);

  // Update contact online status when online users change
  useEffect(() => {
    setContacts((prev) =>
      prev.map((contact) => ({
        ...contact,
        isOnline: onlineUsers.includes(contact.id),
      }))
    );
  }, [onlineUsers]);

  // Fetch messages when contact is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedContact) return;

      try {
        console.log('=== FETCHING MESSAGES ===');
        console.log('Selected contact:', selectedContact);

        setIsLoadingMessages(true);
        const response = await api.get(`/chat/rooms/${selectedContact.id}/messages`);

        if (response.data.success) {
          console.log(`Loaded ${response.data.data.length} messages`);
          setMessages(response.data.data);
        }
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedContact]);

  // Listen for new messages via Supabase Realtime
  useEffect(() => {
    if (!selectedContact || !isConnected) {
      return;
    }

    console.log('📡 Setting up message listener for room:', selectedContact.id);

    const unsubscribe = onMessage((message: ChatMessage) => {
      console.log('📨 New message received via Supabase:', message);

      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }
        return [...prev, message];
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

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    sendTypingIndicator(isTyping);
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)]">
        <ContactsList
          contacts={contacts}
          selectedContactId={selectedContact?.id}
          onSelectContact={setSelectedContact}
        />
        <ChatSection
          contact={selectedContact}
          messages={isLoadingMessages ? [] : messages}
          currentUserId={user?.id || 'admin'}
          currentUserName={user?.name || 'Admin'}
          currentUserAvatar={user?.avatar || '/imageofchat.png'}
          isTyping={isTyping}
          onSendMessage={async (message) => {
            // Send via API (which will trigger Supabase Realtime)
            try {
              await api.post(`/chat/rooms/${selectedContact?.id}/messages`, {
                content: message,
              });
              // Message will be received via Supabase Realtime subscription
            } catch (error) {
              console.error('Failed to send message:', error);
            }
          }}
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
