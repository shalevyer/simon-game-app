/**
 * Toast Notification Component
 * 
 * Shows temporary success/error messages
 */

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      border: 'border-green-400',
      icon: '✓',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      border: 'border-red-400',
      icon: '✕',
    },
    info: {
      bg: 'bg-gradient-to-r from-primary-500 to-primary-600',
      border: 'border-primary-400',
      icon: 'ℹ',
    },
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 animate-slide-in max-w-[calc(100vw-2rem)] sm:max-w-md">
      <div className={`${style.bg} border-2 ${style.border} text-white px-5 py-4 rounded-xl shadow-large flex items-center gap-3 min-w-[280px] sm:min-w-[320px] backdrop-blur-sm`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
          {style.icon}
        </div>
        <span className="font-semibold text-sm sm:text-base flex-1 leading-relaxed">{message}</span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white active:text-white transition-colors text-xl font-bold leading-none flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
