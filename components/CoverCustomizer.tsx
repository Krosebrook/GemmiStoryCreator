import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { generateSingleImage } from '../services/geminiService';
import { SparklesIcon, XCircleIcon } from './Icons';
import { playSound } from '../services/soundService';
import { CustomizationState } from '../types';

interface CoverCustomizerProps {
  coverImage: string | null;
  setCoverImage: (image: string | null) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  storyTitle: string;
  customizations: CustomizationState;
}

export const CoverCustomizer: React.FC<CoverCustomizerProps> = ({ coverImage, setCoverImage, isGenerating, setIsGenerating, storyTitle, customizations }) => {
  const [mode, setMode] = useState<'generate' | 'upload'>('generate');
  
  const createDefaultPrompt = (title: string, customs: CustomizationState) => {
    const kinsleyDesc = `The older girl, Kinsley (7), has ${customs.kinsley.hairColor.toLowerCase()} hair and wears a ${customs.kinsley.cloakColor.toLowerCase()} ${customs.kinsley.cloakStyle.toLowerCase()} cloak.`;
    const ameliaDesc = `The younger girl, Amelia (5), has ${customs.amelia.hairColor.toLowerCase()} hair and wears a ${customs.amelia.cloakColor.toLowerCase()} ${customs.amelia.cloakStyle.toLowerCase()} cloak.`;
    
    return `Book cover for a children’s story titled "${title}". The scene features the two main characters, Kinsley and Amelia, standing on a crooked porch, looking up at a giant, magical moon with excitement and wonder. ${kinsleyDesc} ${ameliaDesc} The scene should be magical, friendly-spooky, and whimsical. The visual art style must be a 3-dimensional, hyper-realistic stop-motion look inspired by "Nightmare Before Christmas" — featuring stitched fabrics, glowing pumpkins, crooked rooftops, warm moonlight, shadowed purples, and teal accents.`;
  };
  
  const [prompt, setPrompt] = useState(createDefaultPrompt(storyTitle, customizations));

  useEffect(() => {
    setPrompt(createDefaultPrompt(storyTitle, customizations));
  }, [storyTitle, customizations]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    playSound('generate');
    setIsGenerating(true);
    try {
      const newImage = await generateSingleImage(prompt);
      setCoverImage(newImage);
    } catch (e) {
      console.error("Failed to generate cover:", e);
      alert("There was an error generating the cover image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
        active 
        ? 'border-teal-400 text-teal-300 bg-slate-800/30' 
        : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full">
      {coverImage ? (
         <div className="relative w-full aspect-video rounded-lg group animate-fade-in-fast">
            <img src={coverImage} alt="Book cover preview" className="w-full h-full object-cover rounded-lg border-2 border-slate-600" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                    onClick={() => {
                      playSound('modalClose');
                      setCoverImage(null)
                    }}
                    className="flex items-center px-4 py-2 bg-red-600/80 text-white rounded-full font-bold hover:bg-red-500 transition-colors"
                >
                    <XCircleIcon className="w-6 h-6 mr-2" />
                    Remove Cover
                </button>
            </div>
         </div>
      ) : (
        <div className="w-full bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="flex border-b border-slate-700 px-4">
            <TabButton active={mode === 'generate'} onClick={() => setMode('generate')}>Generate with AI</TabButton>
            <TabButton active={mode === 'upload'} onClick={() => setMode('upload')}>Upload Your Own</TabButton>
          </div>

          <div className="p-4">
            {mode === 'generate' && (
              <div className="flex flex-col gap-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-28 bg-slate-900 text-gray-300 p-3 rounded-lg border-2 border-slate-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="Enter a prompt for your book cover..."
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-500/80 to-purple-600/80 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Summoning Cover Art...' : 'Generate Cover'}
                </button>
              </div>
            )}
            {mode === 'upload' && (
              <div>
                <ImageUploader 
                  imagePreview={null}
                  onImageUpload={setCoverImage}
                  onImageRemove={() => {}} // Not used here
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Define and inject animation styles
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeInFast {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in-fast {
    animation: fadeInFast 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);
