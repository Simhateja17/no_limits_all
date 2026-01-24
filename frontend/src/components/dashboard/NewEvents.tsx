'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { dataApi, DashboardEvent } from '@/lib/data-api';
import { useAuthStore } from '@/lib/store';

interface Event {
  id: string;
  title: string;
  description: string;
  type?: 'return' | 'inbound' | 'order_attention';
  entityId?: string;
}

interface NewEventsProps {
  events?: Event[];
  onViewAll?: () => void;
}

export function NewEvents({ events: propEvents, onViewAll }: NewEventsProps) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from API
  useEffect(() => {
    // If events are provided as props, use them instead
    if (propEvents && propEvents.length > 0) {
      setEvents(propEvents);
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dataApi.getDashboardEvents(10);
        const transformedEvents: Event[] = data.map((event: DashboardEvent) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          entityId: event.entityId,
        }));
        setEvents(transformedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [propEvents]);

  const handleEventClick = (event: Event) => {
    // Get the base path based on user role
    const roleBasePath = user?.role === 'CLIENT' ? '/client' : user?.role === 'EMPLOYEE' ? '/employee' : '/admin';

    // Navigate to the appropriate page based on event type and entityId
    if (event.type === 'order_attention' && event.entityId) {
      // For orders, navigate to the specific order detail page
      router.push(`${roleBasePath}/orders/${event.entityId}`);
    } else if (event.type === 'return') {
      router.push(`${roleBasePath}/returns`);
    } else if (event.type === 'inbound') {
      router.push(`${roleBasePath}/inbounds`);
    } else {
      // Fallback to orders list
      router.push(`${roleBasePath}/orders`);
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Default: navigate to notifications or activity page
      router.push('/admin/orders');
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
        {t('newEvents')}
      </span>

      {/* Events List */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
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
            Loading events...
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
        {!loading && !error && events.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
            }}
          >
            No recent events
          </div>
        )}

        {/* Events */}
        {!loading && !error && events.map((event) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingBottom: '16px',
              borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer',
            }}
            onClick={() => handleEventClick(event)}
          >
            {/* Event Title */}
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {event.title}
            </span>

            {/* Event Description */}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#6B7280',
                margin: 0,
              }}
            >
              {event.description}
            </p>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button
        onClick={handleViewAll}
        style={{
          width: '100%',
          padding: '9px 17px',
          background: '#FFFFFF',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: '#374151',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F9FAFB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF';
        }}
      >
        {t('viewAll')}
      </button>
    </div>
  );
}
