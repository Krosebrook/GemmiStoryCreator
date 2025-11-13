import React, { useState, useCallback } from 'react';
import { StoryPage, CustomizationState } from './types';
import { generateStoryAndImages, generateSingleImage } from './services/geminiService';
import { Header } from './components/Header';
import { StorybookViewer } from './components/StorybookViewer';
import { LoadingState } from './components/LoadingState';
import { InfoIcon, SparklesIcon, BookOpenIcon, PaintBrushIcon, UploadIcon, PuzzlePieceIcon } from './components/Icons';
import { MASTER_PROMPT, defaultCustomizations, DEFAULT_STORY_TITLE, DEFAULT_BOOK_2_TITLE } from './constants';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { CoverCustomizer } from './components/CoverCustomizer';
import { ImageUploader } from './components/ImageUploader';
import { playSound } from './services/soundService';
import { ThemeSelector } from './components/ThemeSelector';
import { ErrorMessage } from './components/ErrorMessage';

const createDynamicPrompt = (basePrompt: string, customizations: CustomizationState, title: string, book2Title: string, themes: string[]): string => {
  const kinsleyDesc = `Kinsley is 7 years old with ${customizations.kinsley.hairColor.toLowerCase()} hair and a ${customizations.kinsley.expression.toLowerCase()} expression. She is wearing a ${customizations.kinsley.hatStyle.toLowerCase()} hat, and a ${customizations.kinsley.cloakColor.toLowerCase()} ${customizations.kinsley.cloakStyle.toLowerCase()} cloak over her ${customizations.kinsley.outfit.toLowerCase()}. She holds a ${customizations.kinsley.broomDesign.toLowerCase()} broom and carries a ${customizations.kinsley.magicalAccessory.toLowerCase()}.`;
  const ameliaDesc = `Amelia is 5 years old with ${customizations.amelia.hairColor.toLowerCase()} hair and a ${customizations.amelia.expression.toLowerCase()} expression. She is wearing a ${customizations.amelia.hatStyle.toLowerCase()} hat, and a ${customizations.amelia.cloakColor.toLowerCase()} ${customizations.amelia.cloakStyle.toLowerCase()} cloak over her ${customizations.amelia.outfit.toLowerCase()}. She holds a ${customizations.amelia.broomDesign.toLowerCase()} broom and carries a ${customizations.amelia.magicalAccessory.toLowerCase()}.`;
  const themesString = themes.length > 0 ? themes.join(', ') : 'magical and whimsical';

  return basePrompt
    .replace(/\[STORY_TITLE\]/g, title)
    .replace(/\[BOOK_2_TITLE\]/g, book2Title)
    .replace(/\[STORY_THEMES\]/g, themesString)
    .replace(/\[KINSLEY_DESCRIPTION\]/g, kinsleyDesc)
    .replace(/\[AMELIA_DESCRIPTION\]/g, ameliaDesc);
};

const getFriendlyErrorMessage = (error: unknown): { title: string, message: string } => {
    const genericError = {
        title: "An Unexpected Error Occurred",
        message: "Something went wrong. Please check the console for technical details, and try again. If the problem persists, try refreshing the page."
    };

    if (!(error instanceof Error)) {
        return genericError;
    }

    const errorMessage = error.message;

    if (errorMessage.includes("API_KEY")) {
        return {
            title: "API Key Issue",
            message: "Could not connect to the AI service. Please ensure the API key is configured correctly and you have an active internet connection."
        };
    }
    if (errorMessage.includes("STORY_JSON_PARSE_ERROR")) {
        return {
            title: "Story Generation Hiccup",
            message: "The AI's response for the story was not in the expected format. This can be a temporary issue. Please try generating the story again."
        };
    }
    if (errorMessage.includes("STORY_EMPTY_ERROR")) {
        return {
            title: "Empty Story Returned",
            message: "The AI returned an empty story. Your master prompt might be too restrictive. Try adjusting it and generating again."
        };
    }
    if (errorMessage.includes("STORY_SAFETY_BLOCK")) {
        return {
            title: "Content Safety Block",
            message: "The AI blocked the story generation due to its safety settings. Please review your master prompt for any potentially sensitive content and try again."
        };
    }
    if (errorMessage.includes("IMAGE_SAFETY_BLOCK")) {
        return {
            title: "Content Safety Block",
            message: "The AI blocked an image from being generated due to its safety settings. Please review the illustration prompt for any potentially sensitive content and try regenerating."
        };
    }
    if (errorMessage.includes("IMAGE_NO_RESULT_ERROR")) {
        return {
            title: "No Image Generated",
            message: "The AI did not return an image for this prompt. This can sometimes happen. Please try regenerating the image, possibly with a slightly different prompt."
        };
    }
    if (errorMessage.includes("IMAGE_API_ERROR")) {
         return {
            title: "AI Service Error",
            message: "There was a problem communicating with the AI image service. Please check your internet connection and try again. The service may be temporarily unavailable."
        };
    }
    if (errorMessage.includes("STORY_API_ERROR")) {
         return {
            title: "AI Service Error",
            message: "There was a problem communicating with the AI story service. Please check your internet connection and try again. The service may be temporarily unavailable."
        };
    }
    return { ...genericError, message: `${genericError.message} (Details: ${errorMessage})`};
};


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(MASTER_PROMPT);
  const [title, setTitle] = useState<string>(DEFAULT_STORY_TITLE);
  const [book2Title, setBook2Title] = useState<string>(DEFAULT_BOOK_2_TITLE);
  const [storybook, setStorybook] = useState<StoryPage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [customizations, setCustomizations] = useState<CustomizationState>(defaultCustomizations);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['Magic', 'Friendship']);


  const handleThemeChange = (theme: string) => {
    playSound('click');
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const handleGenerateStory = useCallback(async () => {
    playSound('generate');
    if (!prompt.trim() || !title.trim() || !book2Title.trim() || isLoading) return;
    
    if (!coverImage) {
      setError({ title: "Cover Missing", message: "Please design a cover for your storybook before generating the pages."});
      return;
    }

    if (!uploadedImage) {
      setError({ title: "Reference Image Missing", message: "Please upload a reference image for the characters before generating the story."});
      return;
    }

    setIsLoading(true);
    setError(null);
    setStorybook(null);
    setGenerationProgress(0);

    const dynamicPrompt = createDynamicPrompt(prompt, customizations, title, book2Title, selectedThemes);

    try {
      await generateStoryAndImages(
        dynamicPrompt, 
        uploadedImage, 
        setGenerationStatus, 
        setGenerationProgress,
        (pages) => {
          setStorybook(pages);
          setIsLoading(false);
          setGenerationStatus('');
        }
      );
    } catch (err) {
      console.error(err);
      setError(getFriendlyErrorMessage(err));
      setIsLoading(false);
      setGenerationStatus('');
      setGenerationProgress(0);
    }
  }, [prompt, isLoading, customizations, uploadedImage, title, book2Title, coverImage, selectedThemes]);

  const handleRegenerateImage = useCallback(async (pageNumber: number, customPrompt?: string) => {
    if (!storybook || regeneratingPage !== null) return;

    const pageToRegenerate = storybook.find(p => p.page_number === pageNumber);
    if (!pageToRegenerate) return;
    
    playSound('generate');
    setRegeneratingPage(pageNumber);
    setError(null);

    const promptForGeneration = customPrompt || pageToRegenerate.illustration_prompt;

    try {
        const newImageUrl = await generateSingleImage(promptForGeneration);
        setStorybook(currentStorybook => 
            currentStorybook!.map(p => 
                p.page_number === pageNumber ? { ...p, imageUrl: newImageUrl } : p
            )
        );
        playSound('success');
    } catch (err) {
        console.error(err);
        setError(getFriendlyErrorMessage(err));
    } finally {
        setRegeneratingPage(null);
    }
  }, [storybook, regeneratingPage]);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
        {!storybook && !isLoading && (
          <div className="w-full max-w-4xl flex flex-col items-center">
             <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
                <h2 className="text-2xl font-bold text-teal-400 mb-4 flex items-center">
                    <BookOpenIcon className="w-6 h-6 mr-3" />
                    Design Your Book Cover
                </h2>
                <CoverCustomizer
                    coverImage={coverImage}
                    setCoverImage={setCoverImage}
                    isGenerating={isGeneratingCover}
                    setIsGenerating={setIsGeneratingCover}
                    storyTitle={title}
                    customizations={customizations}
                />
             </div>

             <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
                <h2 className="text-2xl font-bold text-teal-400 mb-4 flex items-center">
                    <UploadIcon className="w-6 h-6 mr-3" />
                    Upload Character Reference
                </h2>
                <ImageUploader 
                    imagePreview={uploadedImage}
                    onImageUpload={setUploadedImage}
                    onImageRemove={() => setUploadedImage(null)}
                />
             </div>

             <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
              <h2 className="text-2xl font-bold text-teal-400 mb-4 flex items-center">
                <PaintBrushIcon className="w-6 h-6 mr-3" />
                Customize Your Witches
              </h2>
              <CharacterCustomizer customizations={customizations} setCustomizations={setCustomizations} />
            </div>

            <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
              <h2 className="text-2xl font-bold text-teal-400 mb-4 flex items-center">
                <PuzzlePieceIcon className="w-6 h-6 mr-3" />
                Story Themes
              </h2>
              <ThemeSelector selectedThemes={selectedThemes} onThemeChange={handleThemeChange} />
            </div>

            <div className="w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
              <h2 className="text-2xl font-bold text-teal-400 mb-4 flex items-center">
                <BookOpenIcon className="w-6 h-6 mr-2" />
                Story Details
              </h2>
              <div className="mb-6">
                <label htmlFor="storyTitle" className="block text-sm font-semibold text-slate-400 mb-2">Story Title</label>
                <input
                    id="storyTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 text-gray-300 p-3 rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="Enter your story title..."
                />
              </div>
              <div className="mb-6">
                <label htmlFor="book2Title" className="block text-sm font-semibold text-slate-400 mb-2">Book 2 Title (for the sequel)</label>
                <input
                    id="book2Title"
                    type="text"
                    value={book2Title}
                    onChange={(e) => setBook2Title(e.target.value)}
                    className="w-full bg-slate-900 text-gray-300 p-3 rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    placeholder="Enter the title for book 2..."
                />
              </div>

              <div>
                <label htmlFor="masterPrompt" className="block text-sm font-semibold text-slate-400 mb-2">Master Story Prompt</label>
                 <textarea
                    id="masterPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-64 bg-slate-900 text-gray-300 p-4 rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="Enter your master story prompt here..."
                  />
              </div>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-start text-sm">
                <InfoIcon className="w-5 h-5 text-teal-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400">
                  This master prompt guides Gemini in creating the story's structure, tone, and illustration style. You can edit it to change the narrative. The customizer and uploaded image will automatically be integrated.
                </p>
              </div>
            </div>

            <div className="w-full flex justify-center mt-4">
               <button 
                  onClick={handleGenerateStory}
                  disabled={isLoading || isGeneratingCover}
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <SparklesIcon className="w-6 h-6 mr-3" />
                  Generate Storybook
                </button>
            </div>

            {error && (
               <ErrorMessage
                  title={error.title}
                  message={error.message}
                  onDismiss={() => setError(null)}
               />
            )}
          </div>
        )}

        {isLoading && <LoadingState status={generationStatus} progress={generationProgress} />}

        {storybook && (
          <div className="w-full flex flex-col items-center">
            <StorybookViewer 
              pages={storybook} 
              title={title}
              coverImageUrl={coverImage}
              onRegenerate={handleRegenerateImage}
              regeneratingPage={regeneratingPage}
            />
            <button
                onClick={() => {
                  playSound('click');
                  setStorybook(null);
                  setCoverImage(null);
                  setUploadedImage(null);
                }}
                className="mt-8 px-6 py-2 bg-slate-700 text-slate-300 font-semibold rounded-full hover:bg-slate-600 transition-colors"
            >
                Create New Story
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;