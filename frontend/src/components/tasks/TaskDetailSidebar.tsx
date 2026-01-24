'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

// Task interface matching the table
interface Task {
  id: string;
  taskId: string;
  client: string;
  created: string;
  priority: 'Low' | 'High';
  status: 'Open' | 'Closed';
  title?: string;
  description?: string | null;
  type?: string;
}

// Chat message context interface
interface ChatContext {
  id: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isFromClient: boolean;
}

interface TaskDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  chatContext?: ChatContext;
  onStatusChange?: (taskId: string, newStatus: 'Open' | 'Closed') => void;
}

export function TaskDetailSidebar({
  isOpen,
  onClose,
  task,
  chatContext,
  onStatusChange,
}: TaskDetailSidebarProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const getPriorityColor = (priority: Task['priority']) => {
    return priority === 'High' ? { bg: '#FEE2E2', text: '#991B1B' } : { bg: '#F3F4F6', text: '#003450' };
  };

  const getStatusColor = (status: Task['status']) => {
    return status === 'Open' ? '#F7CB5B' : '#003450';
  };

  const getTranslatedStatus = (status: Task['status']) => {
    return status === 'Open' ? t('open') : t('closed');
  };

  const getTranslatedPriority = (priority: Task['priority']) => {
    return priority === 'High' ? t('high') : t('low');
  };

  if (!task) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Sidebar with slide animation */}
      <div
        ref={sidebarRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(480px, 90vw)',
          background: '#FFFFFF',
          boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.15)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '28px',
                color: '#111827',
                margin: 0,
              }}
            >
              {t('taskId')} #{task.taskId}
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: getStatusColor(task.status),
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#FFFFFF',
                }}
              >
                {getTranslatedStatus(task.status)}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Task Details Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Client */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('client')}
              </label>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#111827',
                }}
              >
                {task.client}
              </span>
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('prioLevel')}
              </label>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 10px',
                    borderRadius: '10px',
                    backgroundColor: getPriorityColor(task.priority).bg,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: getPriorityColor(task.priority).text,
                  }}
                >
                  {getTranslatedPriority(task.priority)}
                </span>
              </div>
            </div>

            {/* Task Type */}
            {task.type && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t('taskType')}
                </label>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '20px',
                    color: '#111827',
                  }}
                >
                  {task.type}
                </span>
              </div>
            )}

            {/* Created */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t('created')}
              </label>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                }}
              >
                {task.created}
              </span>
            </div>

            {/* Description */}
            {task.description && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {t('description')}
                </label>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '22px',
                    color: '#374151',
                    margin: 0,
                  }}
                >
                  {task.description}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#E5E7EB' }} />

          {/* Chat Context Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {t('chatContext') || 'Chat Context'}
            </label>

            {chatContext ? (
              <div
                style={{
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #E5E7EB',
                }}
              >
                {/* Message header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: chatContext.isFromClient ? '#003450' : '#6BAC4D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '12px',
                        color: '#FFFFFF',
                      }}
                    >
                      {chatContext.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        fontSize: '13px',
                        lineHeight: '18px',
                        color: '#111827',
                      }}
                    >
                      {chatContext.senderName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        fontSize: '11px',
                        lineHeight: '14px',
                        color: '#9CA3AF',
                      }}
                    >
                      {chatContext.timestamp}
                    </span>
                  </div>
                </div>

                {/* Message content */}
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '22px',
                    color: '#374151',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {chatContext.content}
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  padding: '32px 16px',
                  border: '1px solid #E5E7EB',
                  textAlign: 'center',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ margin: '0 auto 12px', opacity: 0.4 }}
                >
                  <path
                    d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: '13px',
                    lineHeight: '20px',
                    color: '#9CA3AF',
                    margin: 0,
                  }}
                >
                  {t('noChatContext') || 'No chat context available for this task'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Toggle Status Button */}
          {onStatusChange && (
            <button
              onClick={() => {
                const newStatus = task.status === 'Open' ? 'Closed' : 'Open';
                onStatusChange(task.taskId, newStatus);
              }}
              style={{
                flex: 1,
                height: '40px',
                borderRadius: '6px',
                border: 'none',
                padding: '10px 16px',
                background: task.status === 'Open' ? '#003450' : '#F7CB5B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                {task.status === 'Open' ? (
                  <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M8 3.33334V12.6667M3.33333 8H12.6667" stroke="#003450" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: task.status === 'Open' ? '#FFFFFF' : '#003450',
                }}
              >
                {task.status === 'Open' ? (t('markAsClosed') || 'Mark as Closed') : (t('reopenTask') || 'Reopen Task')}
              </span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              minWidth: '100px',
              height: '40px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '10px 16px',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
              }}
            >
              {tCommon('close') || 'Close'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
