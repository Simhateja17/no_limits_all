'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { Contact } from './ContactsList';
import { CreateTaskModal } from './CreateTaskModal';
import { useTranslations } from 'next-intl';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'error';
}

interface ChatSectionProps {
  contact: Contact | null;
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  isLoadingMessages?: boolean;
  isTyping?: boolean;
  typingUser?: { name: string; avatar: string };
  showCreateTask?: boolean;
}

// Message status indicator component
function MessageStatus({ status }: { status?: ChatMessage['status'] }) {
  if (!status) return null;

  switch (status) {
    case 'pending':
      return (
        <span className="text-gray-400 ml-1" title="Sending...">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" className="animate-spin" style={{ animationDuration: '1s' }}>
              <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </span>
      );
    case 'sent':
      return (
        <span className="text-gray-400 ml-1" title="Sent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
      );
    case 'delivered':
      return (
        <span className="text-gray-400 ml-1" title="Delivered">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12l5 5L17 7" />
            <path d="M7 12l5 5L22 7" />
          </svg>
        </span>
      );
    case 'read':
      return (
        <span className="text-blue-500 ml-1" title="Read">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12l5 5L17 7" />
            <path d="M7 12l5 5L22 7" />
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className="text-red-500 ml-1" title="Failed to send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </span>
      );
    default:
      return null;
  }
}

export function ChatSection({
  contact,
  messages,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onSendMessage,
  onTyping,
  onLoadMore,
  hasMoreMessages = false,
  isLoadingMore = false,
  isLoadingMessages = false,
  isTyping,
  typingUser,
  showCreateTask = true,
}: ChatSectionProps) {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessageContent, setSelectedMessageContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on new messages (but not when loading older messages)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // If we loaded older messages, maintain scroll position
    if (previousScrollHeightRef.current > 0) {
      const scrollDiff = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = scrollDiff;
      previousScrollHeightRef.current = 0;
    } else {
      // New message - scroll to bottom
      scrollToBottom();
    }
  }, [messages]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingMore || !hasMoreMessages || !onLoadMore) return;

    // Load more when scrolled near top (within 100px)
    if (container.scrollTop < 100) {
      previousScrollHeightRef.current = container.scrollHeight;
      onLoadMore();
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Trigger typing indicator
    if (onTyping && e.target.value.length > 0) {
      onTyping();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (!contact) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{
          flex: 1,
          background: '#FFFFFF',
        }}
      >
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '16px',
            color: '#90A0B7',
          }}
        >
          {t('selectConversation')}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{
        flex: 1,
        background: '#FFFFFF',
        minWidth: 0, // Allow shrinking below content size for flex
      }}
    >
      {/* Chat Header with Client Name */}
      <div
        className="flex items-center px-4 md:px-6 py-3 md:py-4"
        style={{
          borderBottom: '1px solid #E4E9EE',
          background: '#FFFFFF',
        }}
      >
        <div
          className="relative flex-shrink-0"
          style={{
            width: '36px',
            height: '36px',
            marginRight: '10px',
          }}
        >
          <Image
            src={contact.avatar}
            alt={contact.name}
            width={36}
            height={36}
            className="rounded-full object-cover w-9 h-9 md:w-10 md:h-10"
          />
        </div>
        <span
          className="truncate"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(14px, 1.3vw, 18px)',
            lineHeight: '100%',
            color: '#192A3E',
          }}
        >
          {contact.name}
        </span>
        <div
          className="ml-2"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: contact.isOnline ? '#22C55E' : '#9CA3AF',
          }}
          title={contact.isOnline ? 'Online' : 'Offline'}
        />
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 md:p-4"
        style={{
          background: '#FAFBFC',
          minHeight: 0,
        }}
      >
        {/* Loading indicator for initial messages */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-500"></div>
          </div>
        )}

        {/* Loading indicator for older messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          </div>
        )}
        
        {/* Load more button (alternative to infinite scroll) */}
        {hasMoreMessages && !isLoadingMore && onLoadMore && (
          <div className="flex justify-center py-2 mb-4">
            <button
              onClick={onLoadMore}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.map((message) => {
          const isCurrentUser = message.senderId === currentUserId;
          
          return (
            <div key={message.id} className="mb-4">
              {/* Message sender info - positioned based on sender */}
              <div className={`flex items-center mb-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                {!isCurrentUser && (
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      marginRight: '8px',
                    }}
                  >
                    <Image
                      src={message.senderAvatar}
                      alt={message.senderName}
                      width={16}
                      height={16}
                      className="rounded-full object-cover"
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                )}
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '100%',
                    letterSpacing: '1%',
                    color: '#192A3E',
                  }}
                >
                  {message.senderName}
                </span>
                <span
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '100%',
                    letterSpacing: '1%',
                    color: '#90A0B7',
                    marginLeft: '8px',
                  }}
                >
                  {formatTime(message.timestamp)}
                </span>
                {/* Message status indicator for sent messages */}
                {isCurrentUser && <MessageStatus status={message.status} />}
                {isCurrentUser && (
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      marginLeft: '8px',
                    }}
                  >
                    <Image
                      src={currentUserAvatar}
                      alt={currentUserName}
                      width={16}
                      height={16}
                      className="rounded-full object-cover"
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`inline-block max-w-[90%] md:max-w-[80%] ${isCurrentUser ? 'ml-auto' : ''}`}
              >
                <div
                  style={{
                    padding: 'clamp(12px, 1.5vw, 20px)',
                    borderRadius: '8px',
                    background: isCurrentUser ? '#FFFFFF' : '#003450',
                    border: isCurrentUser ? '1px solid #E4E9EE' : 'none',
                    display: 'inline-block',
                    opacity: message.status === 'pending' ? 0.7 : 1,
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 400,
                      fontSize: 'clamp(12px, 1.1vw, 15px)',
                      lineHeight: '165%',
                      letterSpacing: '1%',
                      color: isCurrentUser ? '#192A3E' : '#FFFFFF',
                      margin: 0,
                    }}
                  >
                    {message.content}
                  </p>
                </div>

                {/* Create task button - only for non-user messages and when showCreateTask is true */}
                {!isCurrentUser && showCreateTask && (
                  <button
                    onClick={() => {
                      setSelectedMessageContent(message.content);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center mt-2 hover:opacity-80 transition-opacity"
                    style={{
                      background: '#F3F4F6',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '19px',
                      padding: '9px 13px 9px 11px',
                      gap: '8px',
                      height: '38px',
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 6.67V13.33M6.67 10H13.33"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#111827',
                      }}
                    >
                      {t('createTask')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator - positioned just above input area */}
      {isTyping && typingUser && (
        <div
          className="flex items-center px-4 py-3"
          style={{
            background: '#FAFBFC',
          }}
        >
          <div
            className="relative flex-shrink-0"
            style={{
              width: '16px',
              height: '16px',
              marginRight: '8px',
            }}
          >
            <Image
              src={typingUser.avatar}
              alt={typingUser.name}
              width={16}
              height={16}
              className="rounded-full object-cover"
              style={{ width: '16px', height: '16px' }}
            />
          </div>
          <span
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              fontSize: '12px',
              color: '#192A3E',
            }}
          >
            {typingUser.name}
          </span>
          <span
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 400,
              fontSize: '10px',
              color: '#90A0B7',
              marginLeft: '8px',
              fontStyle: 'italic',
            }}
          >
            {tCommon('isTyping')}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div
        className="flex items-center px-3 md:px-4 py-2 md:py-3"
        style={{
          borderTop: '1px solid #E4E9EE',
          background: '#FFFFFF',
          minHeight: '56px',
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          placeholder={t('typeMessage')}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="flex-1 outline-none"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(12px, 1vw, 14px)',
            color: '#192A3E',
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
          }}
        />

        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '16px',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21.44 11.05L12.25 20.24C10.72 21.77 8.18 21.77 6.65 20.24C5.12 18.71 5.12 16.17 6.65 14.64L15.84 5.45C16.81 4.48 18.37 4.48 19.34 5.45C20.31 6.42 20.31 7.98 19.34 8.95L10.15 18.14C9.67 18.62 8.89 18.62 8.41 18.14C7.93 17.66 7.93 16.88 8.41 16.4L16.6 8.21"
              stroke="#90A0B7"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={() => {
            // Handle file upload
          }}
        />
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(task) => {
          console.log('Task created:', task);
          // Handle task creation here
        }}
        clientName={contact?.name || ''}
        initialDescription={selectedMessageContent}
      />
    </div>
  );
}
