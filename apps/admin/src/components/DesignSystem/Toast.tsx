import React, { useEffect } from 'react';

export interface ToastProps {
  show: boolean;
  message: string;
  onClose?: () => void;
  icon?: string;
}

export const Toast: React.FC<ToastProps> = ({
  show,
  message,
  onClose,
  icon = 'check_circle'
}) => {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 pointer-events-none flex items-center gap-3 px-5 py-3.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      <span className="font-label-md text-label-md font-semibold tracking-wide">{message}</span>
    </div>
  );
};

