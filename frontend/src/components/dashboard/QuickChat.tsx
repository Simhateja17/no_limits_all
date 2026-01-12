'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { dataApi, QuickChatMessage } from '@/lib/data-api';

interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  avatarColor?: string;
  timestamp: string;
  content: string;
  tasks?: string[];
  roomId?: string;
  clientName?: string;
}

interface QuickChatProps {
  messages?: ChatMessage[];
}

export function QuickChat({ messages: propMessages }: QuickChatProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent messages from API
  useEffect(() => {
    // If messages are provided as props, use them instead
    if (propMessages && propMessages.length > 0) {
      setMessages(propMessages);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataApi.getRecentChatMessages(5);
        const transformedMessages: ChatMessage[] = data.map((msg: QuickChatMessage) => ({
          id: msg.id,
          sender: msg.sender,
          avatar: msg.avatar || undefined,
          avatarColor: msg.avatarColor,
          timestamp: msg.timestamp,
          content: msg.content,
          tasks: msg.tasks,
          roomId: msg.roomId,
          clientName: msg.clientName,
        }));
        setMessages(transformedMessages);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [propMessages]);

  const handleMessageClick = (roomId?: string) => {
    if (roomId) {
      router.push(`/admin/chat?room=${roomId}`);
    } else {
      router.push('/admin/chat');
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        height: '100%',
        minHeight: '531px',
      }}
    >
      {/* Header */}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#6B7280',
        }}
      >
        {t('quickChat')}
      </span>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
            }}
          >
            Loading messages...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
            }}
          >
            No recent messages
          </div>
        )}

        {/* Messages List */}
        {!loading && !error && messages.map((message) => (
          <div
            key={message.id}
            style={{ display: 'flex', gap: '12px', cursor: 'pointer' }}
            onClick={() => handleMessageClick(message.roomId)}
          >
            {/* Avatar */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: message.avatarColor || '#E5E7EB',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {message.avatar ? (
                <img
                  src={message.avatar}
                  alt={message.sender}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z" fill="#9CA3AF"/>
                        <path d="M10 11.25C6.55375 11.25 3.75 14.0538 3.75 17.5H16.25C16.25 14.0538 13.4462 11.25 10 11.25Z" fill="#9CA3AF"/>
                      </svg>
                    `;
                  }}
                />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z"
                    fill="#9CA3AF"
                  />
                  <path
                    d="M10 11.25C6.55375 11.25 3.75 14.0538 3.75 17.5H16.25C16.25 14.0538 13.4462 11.25 10 11.25Z"
                    fill="#9CA3AF"
                  />
                </svg>
              )}
            </div>

            {/* Message Content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Sender Name */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#111827',
                }}
              >
                {message.sender}
              </span>

              {/* Timestamp */}
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                }}
              >
                {message.timestamp}
              </span>

              {/* Message Text */}
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#374151',
                  margin: '8px 0',
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </p>

              {/* Tasks */}
              {message.tasks && message.tasks.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginTop: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      fontSize: '14px',
                      lineHeight: '32px',
                      color: '#111827',
                    }}
                  >
                    {message.sender}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '32px',
                      color: '#374151',
                    }}
                  >
                    {t('addedTasks')}
                  </span>
                  {message.tasks.map((task) => (
                    <span
                      key={task}
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                        padding: '3px 13px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '13px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: '#F9FAFB',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
        }}
      >
        <input
          type="text"
          placeholder={t('typeMessage')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 400,
            fontSize: '13px',
            lineHeight: '165%',
            letterSpacing: '0.01em',
            color: '#192A3E',
            opacity: inputValue ? 1 : 0.4,
            outline: 'none',
          }}
        />
        <button
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: '#003450',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.6667 1.33334L7.33334 8.66668"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14.6667 1.33334L10 14.6667L7.33334 8.66668L1.33334 6.00001L14.6667 1.33334Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
