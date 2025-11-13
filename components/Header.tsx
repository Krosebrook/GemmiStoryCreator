
import React from 'react';
import { BookIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-center">
        <BookIcon className="w-8 h-8 text-teal-400 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">
          Gemini Storybook Creator
        </h1>
      </div>
    </header>
  );
};
