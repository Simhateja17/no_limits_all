'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount?: number;
  status?: 'read' | 'delivered' | 'error' | 'none';
  isOnline?: boolean;
}

interface ContactsListProps {
  contacts: Contact[];
  selectedContactId?: string;
  onSelectContact: (contact: Contact) => void;
}

export function ContactsList({ contacts, selectedContactId, onSelectContact }: ContactsListProps) {
  const locale = useLocale();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const localeCode = locale === 'de' ? 'de-DE' : 'en-US';
      const day = date.getDate();
      const month = date.toLocaleDateString(localeCode, { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'read':
        return (
          <Image
            src="/sent+read.png"
            alt="Read"
            width={18}
            height={18}
            style={{ width: '18px', height: '18px' }}
          />
        );
      case 'delivered':
        return (
          <Image
            src="/sent.png"
            alt="Sent"
            width={18}
            height={18}
            style={{ width: '18px', height: '18px' }}
          />
        );
      case 'error':
        return (
          <Image
            src="/error.png"
            alt="Error"
            width={18}
            height={18}
            style={{ width: '18px', height: '18px' }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{
        width: '100%',
        maxWidth: '441px',
        minWidth: '280px',
        height: '100%',
        borderRight: '1px solid #E4E9EE',
        background: '#FFFFFF',
      }}
    >
      {contacts.length === 0 && (
        <div
          className="flex items-center justify-center h-full"
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            color: '#90A0B7',
          }}
        >
          No clients found
        </div>
      )}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => onSelectContact(contact)}
          className="flex items-start p-4 cursor-pointer transition-colors hover:bg-gray-50"
          style={{
            borderBottom: '1px solid #E4E9EE',
            background: selectedContactId === contact.id ? '#F3F4F6' : '#FFFFFF',
          }}
        >
          {/* Avatar */}
          <div
            className="relative flex-shrink-0"
            style={{
              width: '28px',
              height: '28px',
              marginRight: '12px',
            }}
          >
            <Image
              src={contact.avatar}
              alt={contact.name}
              width={28}
              height={28}
              className="rounded-full object-cover"
              style={{ width: '28px', height: '28px' }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name and Date Row */}
            <div className="flex items-center justify-between mb-1">
              <span
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(14px, 1.3vw, 18px)',
                  lineHeight: '1.4',
                  color: '#003450',
                }}
                className="truncate"
              >
                {contact.name}
              </span>
              <span
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(10px, 0.95vw, 13px)',
                  lineHeight: '1.4',
                  letterSpacing: '1%',
                  color: '#90A0B7',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  marginLeft: '8px',
                }}
              >
                {formatDate(contact.lastMessageDate)}
              </span>
            </div>

            {/* Preview and Badge Row */}
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(10px, 0.88vw, 12px)',
                  lineHeight: '1.4',
                  letterSpacing: '1%',
                  color: contact.lastMessage ? '#192A3E' : '#90A0B7',
                  fontStyle: contact.lastMessage ? 'normal' : 'italic',
                }}
                className="truncate flex-1"
              >
                {contact.lastMessage || 'No messages yet'}
              </span>

              <div className="flex items-center gap-2 ml-2">
                {/* Status icon */}
                {getStatusIcon(contact.status)}

                {/* Unread count badge */}
                {contact.unreadCount && contact.unreadCount > 0 && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '27px',
                      height: '27px',
                      borderRadius: '4px',
                      background: '#003450',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontWeight: 400,
                        fontSize: '13px',
                        lineHeight: '100%',
                        letterSpacing: '1%',
                        color: '#FFFFFF',
                        textAlign: 'center',
                      }}
                    >
                      {contact.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
