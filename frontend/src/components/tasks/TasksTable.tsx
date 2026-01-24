'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { dataApi, CreateTaskInput } from '@/lib/data-api';
import { useTasks, getTaskClientNames, DisplayTask } from '@/lib/hooks';
import { TaskDetailSidebar } from './TaskDetailSidebar';

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Tab type
type TabType = 'all' | 'open' | 'closed';

// Task data for creation
interface TaskData {
  client: string;
  taskType: string;
  prioLevel: string;
  description: string;
}

// Task types and priority levels - use translation keys
const taskTypeKeys = [
  'internalWarehouse',
  'clientCommunication',
  'orderProcessing',
  'returns',
  'inventoryCheck',
];

const prioLevelKeys = ['low', 'medium', 'high', 'urgent'];

// Create Task Modal Component (without Adopt Client Message button)
function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskData) => void;
  clients: string[];
}) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const [selectedClient, setSelectedClient] = useState(clients[1] || '');
  const [taskType, setTaskType] = useState('internalWarehouse');
  const [prioLevel, setPrioLevel] = useState('low');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({
      client: selectedClient,
      taskType,
      prioLevel,
      description,
    });
    // Reset form
    setSelectedClient(clients[1] || '');
    setTaskType('internalWarehouse');
    setPrioLevel('low');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  // Filter out 'ALL' from client options (not needed since we removed it from array)
  const clientOptions = clients;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 512px)',
          maxHeight: '90vh',
          borderRadius: '8px',
          padding: 'clamp(16px, 1.77vw, 24px)',
          gap: 'clamp(16px, 1.84vw, 25px)',
          background: '#FFFFFF',
          boxShadow: '0px 10px 10px -5px rgba(0, 0, 0, 0.04), 0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
        }}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              background: '#D1FAE5',
            }}
          >
            <Image
              src="/Icon.png"
              alt="Task icon"
              width={22}
              height={22}
              style={{ width: '22px', height: '22px' }}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 'clamp(14px, 1.33vw, 18px)',
            lineHeight: '24px',
            textAlign: 'center',
            color: '#111827',
            margin: 0,
          }}
        >
          {t('createTask')}
        </h2>

        {/* Client Field */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('client')}
          </label>
          <div
            className="relative"
            style={{
              height: '38px',
            }}
          >
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full h-full appearance-none cursor-pointer"
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '9px 13px',
                paddingRight: '40px',
                background: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
                outline: 'none',
              }}
            >
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                right: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M6 8L10 12L14 8"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Task Type Field */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('taskType')}
          </label>
          <div
            className="relative"
            style={{
              height: '38px',
            }}
          >
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full h-full appearance-none cursor-pointer"
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '9px 13px',
                paddingRight: '40px',
                background: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
                outline: 'none',
              }}
            >
              {taskTypeKeys.map((type) => (
                <option key={type} value={type}>
                  {t(type)}
                </option>
              ))}
            </select>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                right: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M6 8L10 12L14 8"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Prio Level Field */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('prioLevel')}
          </label>
          <div
            className="relative"
            style={{
              height: '38px',
            }}
          >
            <select
              value={prioLevel}
              onChange={(e) => setPrioLevel(e.target.value)}
              className="w-full h-full appearance-none cursor-pointer"
              style={{
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '9px 13px',
                paddingRight: '40px',
                background: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
                outline: 'none',
              }}
            >
              {prioLevelKeys.map((level) => (
                <option key={level} value={level}>
                  {t(level)}
                </option>
              ))}
            </select>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                right: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M6 8L10 12L14 8"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Task Description Field */}
        <div className="flex flex-col gap-2">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none outline-none"
            style={{
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '12px 13px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#111827',
            }}
            placeholder={`${t('description')}...`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{
              height: '38px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '9px 17px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
            }}
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
              {tCommon('back')}
            </span>
          </button>

          {/* Create Button */}
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center hover:opacity-90 transition-opacity"
            style={{
              height: '38px',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 17px',
              background: '#003450',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#FFFFFF',
              }}
            >
              {tCommon('create')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

interface TasksTableProps {
  showClientColumn: boolean;
  baseUrl: string;
}

export function TasksTable({ showClientColumn, baseUrl }: TasksTableProps) {
  const router = useRouter();
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DisplayTask | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch tasks from API
  const { tasks, loading, error, refetch, updateTaskStatus } = useTasks();
  
  // Get unique client names from tasks for filter dropdown
  const clientNames = useMemo(() => getTaskClientNames(tasks), [tasks]);

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      setSelectedTask(task);
      setIsSidebarOpen(true);
    }
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    // Delay clearing selected task to allow animation to complete
    setTimeout(() => {
      setSelectedTask(null);
    }, 300);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'Open' | 'Closed') => {
    try {
      await updateTaskStatus(taskId, newStatus);
      // Update selected task if it's the one being changed
      if (selectedTask?.taskId === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleCreateTask = async (taskData: TaskData) => {
    try {
      // Map task data to API format
      const taskTypeMap: Record<string, CreateTaskInput['type']> = {
        'internalWarehouse': 'INTERNAL_WAREHOUSE',
        'clientCommunication': 'CLIENT_COMMUNICATION',
        'orderProcessing': 'ORDER_PROCESSING',
        'returns': 'RETURNS',
        'inventoryCheck': 'INVENTORY_CHECK',
        'other': 'OTHER',
      };

      const priorityMap: Record<string, CreateTaskInput['priority']> = {
        'low': 'LOW',
        'medium': 'MEDIUM',
        'high': 'HIGH',
        'urgent': 'URGENT',
      };

      const input: CreateTaskInput = {
        title: taskData.description.slice(0, 100) || 'New Task',
        description: taskData.description,
        type: taskTypeMap[taskData.taskType] || 'OTHER',
        priority: priorityMap[taskData.prioLevel.toLowerCase()] || 'MEDIUM',
        status: 'OPEN',
      };

      await dataApi.createTask(input);
      setIsCreateModalOpen(false);
      
      // Refresh the tasks list
      await refetch();
    } catch (error) {
      console.error('Error creating task:', error);
      // Could show an error toast here
    }
  };

  // Filter tasks based on tab and search
  const filteredTasks = useMemo(() => {
    let filteredList = [...tasks];

    // Filter by tab
    if (activeTab === 'open') {
      filteredList = filteredList.filter(t => t.status === 'Open');
    } else if (activeTab === 'closed') {
      filteredList = filteredList.filter(t => t.status === 'Closed');
    }

    // Filter by client
    if (clientFilter !== 'ALL') {
      filteredList = filteredList.filter(t => t.client === clientFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter(t =>
        t.taskId.toLowerCase().includes(query) ||
        t.client.toLowerCase().includes(query)
      );
    }

    return filteredList;
  }, [activeTab, searchQuery, clientFilter, tasks]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Count for tabs
  const allCount = tasks.length;
  const openCount = tasks.filter(t => t.status === 'Open').length;
  const closedCount = tasks.filter(t => t.status === 'Closed').length;

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Priority badge component - responsive sizing based on 1358px reference
  const PriorityBadge = ({ priority }: { priority: DisplayTask['priority'] }) => {
    const isHigh = priority === 'High';
    const priorityKey = priority.toLowerCase() as 'low' | 'high';
    
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(1.5px, 0.15vw, 2px) clamp(8px, 0.74vw, 10px)',
          borderRadius: '10px',
          backgroundColor: isHigh ? '#FEE2E2' : '#F3F4F6',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(10px, 0.88vw, 12px)',
          lineHeight: 'clamp(14px, 1.18vw, 16px)',
          letterSpacing: '0%',
          textAlign: 'center',
          color: isHigh ? '#991B1B' : '#003450',
          minHeight: 'clamp(16px, 1.47vw, 20px)',
        }}
      >
        {t(priorityKey)}
      </span>
    );
  };

  // Get translated status
  const getTranslatedStatus = (status: DisplayTask['status']) => {
    return status === 'Open' ? t('open') : t('closed');
  };

  // Mobile hook
  const isMobile = useIsMobile();

  // Task Card Component for mobile view
  const TaskCard = ({ task }: { task: DisplayTask }) => (
    <div
      onClick={() => handleTaskClick(task.taskId)}
      className="p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-sm font-medium text-gray-900">#{task.taskId}</span>
          <p className="text-xs text-gray-500 mt-1">{task.client}</p>
        </div>
        <div
          className="px-3 py-1 text-xs font-medium text-white rounded"
          style={{ backgroundColor: task.status === 'Open' ? '#F7CB5B' : '#003450' }}
        >
          {getTranslatedStatus(task.status)}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{task.created}</span>
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col" style={{ gap: 'clamp(16px, 1.76vw, 24px)' }}>
      {/* Header with Tabs and Create Button */}
      <div className="flex flex-col w-full">
        <div className="flex items-end justify-between w-full gap-4">
        {/* Tabs - Mobile dropdown or desktop tabs */}
        {isMobile ? (
          <div className="flex-1">
            <select
              value={activeTab}
              onChange={(e) => { setActiveTab(e.target.value as TabType); setCurrentPage(1); }}
              className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700"
            >
              <option value="all">{t('allTasks')} ({allCount})</option>
              <option value="open">{t('open')} ({openCount})</option>
              <option value="closed">{t('closed')} ({closedCount})</option>
            </select>
          </div>
        ) : (
        <div
          className="flex items-end"
          style={{
            gap: 'clamp(16px, 1.76vw, 24px)',
          }}
        >
          {/* All Tasks Tab */}
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'all' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'all' ? '#003450' : '#6B7280',
              }}
            >
              {t('allTasks')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'all' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'all' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {allCount}
            </span>
          </button>

          {/* Open Tab */}
          <button
            onClick={() => { setActiveTab('open'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'open' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'open' ? '#003450' : '#6B7280',
              }}
            >
              {t('open')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'open' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'open' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {openCount}
            </span>
          </button>

          {/* Closed Tab */}
          <button
            onClick={() => { setActiveTab('closed'); setCurrentPage(1); }}
            className="flex items-center"
            style={{
              gap: 'clamp(4px, 0.59vw, 8px)',
              paddingBottom: 'clamp(8px, 0.88vw, 12px)',
              borderBottom: activeTab === 'closed' ? '2px solid #003450' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(12px, 1.03vw, 14px)',
                lineHeight: '20px',
                color: activeTab === 'closed' ? '#003450' : '#6B7280',
              }}
            >
              {t('closed')}
            </span>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: '16px',
                color: activeTab === 'closed' ? '#003450' : '#6B7280',
                backgroundColor: activeTab === 'closed' ? '#E5E7EB' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {closedCount}
            </span>
          </button>
        </div>
        )}

        {/* Create Task Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="shrink-0"
          style={{
            height: 'clamp(32px, 2.8vw, 38px)',
            borderRadius: '6px',
            paddingTop: 'clamp(7px, 0.66vw, 9px)',
            paddingRight: 'clamp(13px, 1.25vw, 17px)',
            paddingBottom: 'clamp(7px, 0.66vw, 9px)',
            paddingLeft: 'clamp(13px, 1.25vw, 17px)',
            backgroundColor: '#003450',
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            whiteSpace: 'nowrap',
            marginBottom: isMobile ? '0' : 'clamp(8px, 0.88vw, 12px)',
          }}
        >
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(12px, 1.03vw, 14px)',
              lineHeight: '20px',
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '+' : t('createTask')}
          </span>
        </button>
      </div>

      {/* Full-width horizontal line below tabs - hidden on mobile */}
      {!isMobile && (
      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: '#E5E7EB',
          marginTop: '-1px', // Overlap with tab border
        }}
      />
      )}
      </div>

      {/* Filter and Search Row */}
      <div className="flex items-end gap-4 md:gap-6 flex-wrap">
        {/* Filter by Client */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {t('filterByCustomer')}
          </label>
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
              className="w-full md:w-[320px]"
              style={{
                maxWidth: '100%',
                height: '38px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                padding: '9px 13px',
                paddingRight: '32px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#374151',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option key="ALL" value="ALL">
                {tCommon('all')}
              </option>
              {clientNames.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
            {/* Dropdown Arrow */}
            <div
              style={{
                position: 'absolute',
                right: '13px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          >
            {tCommon('search')}
          </label>
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-[320px]"
            style={{
              maxWidth: '100%',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 13px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#374151',
            }}
          />
        </div>
      </div>

      {/* Tasks Table - Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="flex flex-col gap-3">
          {paginatedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {paginatedTasks.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              {t('noTasksFound')}
            </div>
          )}
        </div>
      ) : (
      <div
        style={{
          width: '100%',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'minmax(100px, 1fr) minmax(120px, 1.5fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr)',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB',
            alignItems: 'center',
          }}
        >
          <div style={{ padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.77vw, 24px)' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: 'clamp(14px, 1.18vw, 16px)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('taskId')}
            </span>
          </div>
          <div style={{ padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.77vw, 24px)' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: 'clamp(14px, 1.18vw, 16px)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('client')}
            </span>
          </div>
          <div style={{ padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.77vw, 24px)' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: 'clamp(14px, 1.18vw, 16px)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('created')}
            </span>
          </div>
          <div style={{ padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.77vw, 24px)' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: 'clamp(14px, 1.18vw, 16px)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {t('prioLevel')}
            </span>
          </div>
          <div style={{ padding: 'clamp(10px, 0.88vw, 12px) clamp(18px, 1.77vw, 24px)', display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(10px, 0.88vw, 12px)',
                lineHeight: 'clamp(14px, 1.18vw, 16px)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B7280',
              }}
            >
              {tCommon('status')}
            </span>
          </div>
        </div>

        {/* Table Body */}
        {paginatedTasks.map((task, index) => (
          <div
            key={task.id}
            className="grid"
            onClick={() => handleTaskClick(task.taskId)}
            style={{
              gridTemplateColumns: 'minmax(100px, 1fr) minmax(120px, 1.5fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr)',
              borderBottom: index < paginatedTasks.length - 1 ? '1px solid #E5E7EB' : 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              alignItems: 'stretch',
            }}
            onMouseEnter={(e) => {
              // Don't change background on hover for the whole row since Status has its own bg
              const cells = e.currentTarget.children;
              for (let i = 0; i < cells.length - 1; i++) {
                (cells[i] as HTMLElement).style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseLeave={(e) => {
              const cells = e.currentTarget.children;
              for (let i = 0; i < cells.length - 1; i++) {
                (cells[i] as HTMLElement).style.backgroundColor = '#FFFFFF';
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.77vw, 24px)',
                backgroundColor: '#FFFFFF',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: 'clamp(16px, 1.47vw, 20px)',
                  color: '#111827',
                }}
              >
                {task.taskId}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.77vw, 24px)',
                backgroundColor: '#FFFFFF',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: 'clamp(16px, 1.47vw, 20px)',
                  color: '#111827',
                }}
              >
                {task.client}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.77vw, 24px)',
                backgroundColor: '#FFFFFF',
                transition: 'background-color 0.15s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: 'clamp(12px, 1.03vw, 14px)',
                  lineHeight: 'clamp(16px, 1.47vw, 20px)',
                  color: '#6B7280',
                }}
              >
                {task.created}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(12px, 1.18vw, 16px) clamp(18px, 1.77vw, 24px)',
                backgroundColor: '#FFFFFF',
                transition: 'background-color 0.15s ease',
              }}
            >
              <PriorityBadge priority={task.priority} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                minWidth: 'clamp(114px, 11.19vw, 152px)',
                padding: '0 17%',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  backgroundColor: task.status === 'Open' ? '#F7CB5B' : '#003450',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 400,
                    fontSize: 'clamp(12px, 1.03vw, 14px)',
                    lineHeight: 'clamp(16px, 1.47vw, 20px)',
                    color: '#FFFFFF',
                  }}
                >
                  {getTranslatedStatus(task.status)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {paginatedTasks.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#6B7280',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            }}
          >
            {t('noTasksFound')}
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          paddingTop: '12px',
        }}
      >
        <span
          className="text-sm text-gray-700 order-2 sm:order-1"
          style={{
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Showing <span style={{ fontWeight: 500 }}>{filteredTasks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
          <span style={{ fontWeight: 500 }}>{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of{' '}
          <span style={{ fontWeight: 500 }}>{filteredTasks.length}</span> results
        </span>

        <div className="flex items-center gap-3 order-1 sm:order-2">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            style={{
              minWidth: '92px',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 17px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
              Previous
            </span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            style={{
              minWidth: '92px',
              height: '38px',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              padding: '9px 17px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
              {tCommon('next')}
            </span>
          </button>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        clients={clientNames}
      />

      {/* Task Detail Sidebar */}
      <TaskDetailSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        task={selectedTask}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
