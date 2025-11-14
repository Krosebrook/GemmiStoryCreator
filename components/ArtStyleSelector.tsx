import React from 'react';
import { artStyles } from '../constants';

interface ArtStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

export const ArtStyleSelector: React.FC<ArtStyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.keys(artStyles).map(style => {
        const isSelected = selectedStyle === style;
        return (
          <button
            key={style}
            onClick={() => onStyleChange(style)}
            className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all duration-200 ${
              isSelected
                ? 'bg-teal-400/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10'
                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {style}
          </button>
        );
      })}
    </div>
  );
};
