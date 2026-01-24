import { useState, useEffect, useCallback } from 'react';
import { dataApi, Task } from '@/lib/data-api';

// Task status type for display
type TaskStatusDisplay = 'Open' | 'Closed';

// Task priority for display
type TaskPriorityDisplay = 'Low' | 'High';

// Transform API task to display format
export interface DisplayTask {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  client: string;
  clientId: string | null;
  created: string;
  priority: TaskPriorityDisplay;
  status: TaskStatusDisplay;
  type: string;
  dueDate: string | null;
  assignee: string | null;
  creator: string;
}

// Map API status to display status
function mapStatusToDisplay(apiStatus: Task['status']): TaskStatusDisplay {
  if (apiStatus === 'OPEN' || apiStatus === 'IN_PROGRESS') {
    return 'Open';
  }
  return 'Closed';
}

// Map API priority to display priority
function mapPriorityToDisplay(apiPriority: Task['priority']): TaskPriorityDisplay {
  if (apiPriority === 'HIGH' || apiPriority === 'URGENT') {
    return 'High';
  }
  return 'Low';
}

// Map API type to display type
function mapTypeToDisplay(apiType: Task['type']): string {
  const typeMap: Record<Task['type'], string> = {
    'INTERNAL_WAREHOUSE': 'Internal Warehouse',
    'CLIENT_COMMUNICATION': 'Client Communication',
    'ORDER_PROCESSING': 'Order Processing',
    'RETURNS': 'Returns',
    'INVENTORY_CHECK': 'Inventory Check',
    'OTHER': 'Other',
  };
  return typeMap[apiType] || 'Other';
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // Format as date for older tasks
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Transform API Task to DisplayTask
function transformTask(apiTask: Task): DisplayTask {
  return {
    id: apiTask.id,
    taskId: apiTask.taskId,
    title: apiTask.title,
    description: apiTask.description,
    client: apiTask.client?.companyName || apiTask.client?.name || 'Warehouse',
    clientId: apiTask.clientId,
    created: formatRelativeTime(new Date(apiTask.createdAt)),
    priority: mapPriorityToDisplay(apiTask.priority),
    status: mapStatusToDisplay(apiTask.status),
    type: mapTypeToDisplay(apiTask.type),
    dueDate: apiTask.dueDate,
    assignee: apiTask.assignee?.name || null,
    creator: apiTask.creator?.name || 'Unknown',
  };
}

interface UseTasksResult {
  tasks: DisplayTask[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'Open' | 'Closed') => Promise<void>;
}

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiTasks = await dataApi.getTasks();
      const displayTasks = apiTasks.map(transformTask);
      setTasks(displayTasks);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: 'Open' | 'Closed') => {
    try {
      // Find the task by taskId (display ID)
      const task = tasks.find(t => t.taskId === taskId);
      if (!task) return;

      // Map display status to API status
      const apiStatus = status === 'Open' ? 'OPEN' : 'CLOSED';
      
      await dataApi.updateTask(task.id, { status: apiStatus });
      
      // Update local state
      setTasks(prev => prev.map(t => 
        t.taskId === taskId ? { ...t, status } : t
      ));
    } catch (err: any) {
      console.error('Error updating task status:', err);
      throw err;
    }
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, loading, error, refetch: fetchTasks, updateTaskStatus };
}

// Get unique client names for filter dropdown
export function getTaskClientNames(tasks: DisplayTask[]): string[] {
  const uniqueClients = [...new Set(tasks.map(t => t.client))];
  return uniqueClients.filter(Boolean).sort();
}
