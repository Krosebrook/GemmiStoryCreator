import React from 'react';
import { CustomizationState, CharacterOptions } from '../types';
import { customizationOptions } from '../constants';
import { playSound } from '../services/soundService';

interface CharacterCustomizerProps {
  customizations: CustomizationState;
  setCustomizations: React.Dispatch<React.SetStateAction<CustomizationState>>;
}

type CharacterName = 'kinsley' | 'amelia';
type OptionCategory = keyof Omit<CharacterOptions, 'description'>;

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({ customizations, setCustomizations }) => {

  const handleOptionChange = (character: CharacterName, category: OptionCategory, value: string) => {
    playSound('click');
    setCustomizations(prev => ({
      ...prev,
      [character]: {
        ...prev[character],
        [category]: value,
      }
    }));
  };

  const handleDescriptionChange = (character: CharacterName, value: string) => {
    setCustomizations(prev => ({
        ...prev,
        [character]: {
            ...prev[character],
            description: value,
        }
    }));
  };

  const renderOptions = (character: CharacterName, category: OptionCategory) => {
    const options = customizationOptions[category] || [];
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = customizations[character][category] === option;
          return (
            <button
              key={option}
              onClick={() => handleOptionChange(character, category, option)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-all duration-200 ${
                isSelected 
                ? 'bg-teal-400/20 border-teal-400 text-teal-300 shadow-lg shadow-teal-500/10' 
                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    );
  };
  
  const renderCharacterSheet = (character: CharacterName, name: string) => (
    <div className="flex-1 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold text-purple-400 mb-4">{name}</h3>
        {character === 'kinsley' && (
            <div className="mb-4">
                <label htmlFor="kinsley-description" className="block text-sm font-semibold text-slate-400 mb-2">Kinsley's Narrative Description</label>
                <textarea
                    id="kinsley-description"
                    value={customizations.kinsley.description}
                    onChange={(e) => handleDescriptionChange('kinsley', e.target.value)}
                    className="w-full h-24 bg-slate-800 text-gray-300 p-3 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Describe Kinsley's appearance and personality..."
                />
            </div>
        )}
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Expression</label>
                {renderOptions(character, 'expression')}
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Hair Color</label>
                {renderOptions(character, 'hairColor')}
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Hat Style</label>
                {renderOptions(character, 'hatStyle')}
            </div>
             <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Outfit</label>
                {renderOptions(character, 'outfit')}
            </div>
             <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Cloak Style</label>
                {renderOptions(character, 'cloakStyle')}
            </div>
             <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Cloak Color</label>
                {renderOptions(character, 'cloakColor')}
            </div>
             <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Broom Design</label>
                {renderOptions(character, 'broomDesign')}
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Magical Accessory</label>
                {renderOptions(character, 'magicalAccessory')}
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      {renderCharacterSheet('kinsley', 'Kinsley (Age 7)')}
      {renderCharacterSheet('amelia', 'Amelia (Age 5)')}
    </div>
  );
};