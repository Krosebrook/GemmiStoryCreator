import React, { useState } from 'react';
import { StoryPage } from '../types';
import { SparklesIcon, XMarkIcon } from './Icons';
import { playSound } from '../services/soundService';

interface RegenerationPromptModalProps {
  page: StoryPage;
  onConfirm: (newPrompt: string) => void;
  onCancel: () => void;
  isRegenerating: boolean;
}

export const RegenerationPromptModal: React.FC<RegenerationPromptModalProps> = ({ page, onConfirm, onCancel, isRegenerating }) => {
  const [prompt, setPrompt] = useState(page.illustration_prompt);

  const handleConfirm = () => {
    if (prompt.trim()) {
      playSound('generate');
      onConfirm(prompt);
    }
  };
  
  const handleCancel = () => {
    playSound('modalClose');
    onCancel();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={handleCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl flex flex-col animate-fade-in-fast" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-xl font-bold text-teal-400">Customize & Regenerate Image</h3>
          <button onClick={handleCancel} className="p-1 rounded-full hover:bg-slate-700 transition-colors" aria-label="Close">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex-grow">
          <label htmlFor="regeneration-prompt" className="block text-sm text-slate-400 mb-2">
            You are regenerating the image for <span className="font-bold text-slate-300">Page {page.page_number}</span>. You can edit the original illustration prompt below.
          </label>
          <textarea
            id="regeneration-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-48 bg-slate-900 text-gray-300 p-3 rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            placeholder="Enter illustration prompt..."
          />
        </div>
        <div className="flex justify-end p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-2xl">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-700 text-slate-300 font-semibold rounded-full hover:bg-slate-600 transition-colors mr-3"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRegenerating || !prompt.trim()}
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};
