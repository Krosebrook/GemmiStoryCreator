import React from 'react';
import { XCircleIcon } from './Icons';

interface ErrorMessageProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message, onDismiss }) => {
  return (
    <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 w-full max-w-4xl relative animate-fade-in">
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 text-red-300 hover:text-white transition-colors" aria-label="Dismiss error">
            <XCircleIcon className="w-6 h-6" />
        </button>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-sm">{message}</p>
    </div>
  );
};

// Add fade-in animation to tailwind config (or in a style tag if no config is present)
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
`;
document.head.appendChild(style);
