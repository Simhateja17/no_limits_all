'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskData) => void;
  clientName: string;
  initialDescription?: string;
}

interface TaskData {
  client: string;
  taskType: string;
  prioLevel: string;
  description: string;
}

const taskTypeKeys = [
  'internalWarehouse',
  'clientCommunication',
  'orderProcessing',
  'returns',
  'inventoryCheck',
];

const prioLevelKeys = ['low', 'medium', 'high', 'urgent'];

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  clientName,
  initialDescription = '',
}: CreateTaskModalProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const tChat = useTranslations('chat');
  const [taskType, setTaskType] = useState('internalWarehouse');
  const [prioLevel, setPrioLevel] = useState('low');
  const [description, setDescription] = useState(initialDescription);

  const handleSubmit = () => {
    onSubmit({
      client: clientName,
      taskType,
      prioLevel,
      description,
    });
    onClose();
  };

  const handleAdoptMessage = () => {
    // This would typically add the message content to the description
    if (initialDescription && !description.includes(initialDescription)) {
      setDescription(
        description
          ? `${description}\n\n${initialDescription}`
          : initialDescription
      );
    }
  };

  if (!isOpen) return null;

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
          width: 'clamp(360px, 37.7vw, 512px)',
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
            className="flex items-center justify-between"
            style={{
              height: '38px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              padding: '9px 13px',
              background: '#FFFFFF',
              boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '20px',
                color: '#111827',
              }}
            >
              {clientName}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
              {taskTypeKeys.map((key) => (
                <option key={key} value={key}>
                  {t(key)}
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
              {prioLevelKeys.map((key) => (
                <option key={key} value={key}>
                  {t(key)}
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

        {/* Adopt Client Message Button */}
        <div className="flex justify-center">
          <button
            onClick={handleAdoptMessage}
            className="flex items-center hover:opacity-80 transition-opacity"
            style={{
              height: '38px',
              borderRadius: '19px',
              padding: '9px 13px 9px 11px',
              gap: '8px',
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
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
              {tChat('adoptClientMessage')}
            </span>
          </button>
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
