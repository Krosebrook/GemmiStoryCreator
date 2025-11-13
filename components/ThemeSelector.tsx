import React from 'react';
import { storyThemes } from '../constants';

interface ThemeSelectorProps {
  selectedThemes: string[];
  onThemeChange: (theme: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedThemes, onThemeChange }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {storyThemes.map(theme => {
        const isSelected = selectedThemes.includes(theme);
        return (
          <button
            key={theme}
            onClick={() => onThemeChange(theme)}
            className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all duration-200 ${
              isSelected
                ? 'bg-purple-400/20 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/10'
                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {theme}
          </button>
        );
      })}
    </div>
  );
};
