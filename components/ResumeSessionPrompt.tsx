import React from 'react';
import { ClockCounterClockwiseIcon, SparklesIcon } from './Icons';

interface ResumeSessionPromptProps {
  onResume: () => void;
  onStartNew: () => void;
}

export const ResumeSessionPrompt: React.FC<ResumeSessionPromptProps> = ({ onResume, onStartNew }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-800/50 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400 mb-4">
          Welcome Back!
        </h1>
        <p className="text-slate-400 mb-8">
          We found a previously saved storybook session. Would you like to pick up where you left off?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onResume}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center"
          >
            <ClockCounterClockwiseIcon className="w-6 h-6 mr-3" />
            Resume Session
          </button>
          <button
            onClick={onStartNew}
            className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-slate-300 font-semibold rounded-full hover:bg-slate-600 transition-colors flex items-center justify-center"
          >
            <SparklesIcon className="w-6 h-6 mr-3" />
            Start a New Story
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};