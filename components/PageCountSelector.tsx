import React from 'react';
import { RectangleStackIcon } from './Icons';
import { playSound } from '../services/soundService';

interface PageCountSelectorProps {
  pageCount: number;
  onPageCountChange: (count: number) => void;
}

export const PageCountSelector: React.FC<PageCountSelectorProps> = ({ pageCount, onPageCountChange }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPageCountChange(Number(event.target.value));
  };
  
  const handleInteraction = () => {
    playSound('click');
  }

  return (
    <div>
      <label htmlFor="pageCount" className="flex items-center text-sm font-semibold text-slate-400 mb-2">
        <RectangleStackIcon className="w-5 h-5 mr-2" />
        Number of Pages
      </label>
      <div className="flex items-center gap-4">
        <input
          id="pageCount"
          type="range"
          min="4"
          max="16"
          step="2"
          value={pageCount}
          onChange={handleChange}
          onMouseDown={handleInteraction}
          onTouchStart={handleInteraction}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 thumb:bg-teal-400"
          style={{
            // Custom styles for slider thumb
            '--thumb-color': '#2dd4bf',
          } as React.CSSProperties}
        />
        <span className="text-lg font-bold text-teal-400 bg-slate-800 px-3 py-1 rounded-md w-16 text-center">{pageCount}</span>
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: var(--thumb-color);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            margin-top: -8px;
        }
        input[type=range]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: var(--thumb-color);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
        }
      `}</style>
    </div>
  );
};
