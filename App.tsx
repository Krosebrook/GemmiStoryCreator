import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StoryPage, CustomizationState } from './types';
import { generateStoryAndImages, generateSingleImage } from './services/geminiService';
import { Header } from './components/Header';
import { StorybookViewer } from './components/StorybookViewer';
import { LoadingState } from './components/LoadingState';
import { InfoIcon, SparklesIcon, BookOpenIcon, PaintBrushIcon, UploadIcon, PuzzlePieceIcon, MicrophoneIcon } from './components/Icons';
import { MASTER_PROMPT, defaultCustomizations, DEFAULT_STORY_TITLE, DEFAULT_BOOK_2_TITLE, artStyles } from './constants';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { CoverCustomizer } from './components/CoverCustomizer';
import { ImageUploader } from './components/ImageUploader';
import { playSound } from './services/soundService';
import { ThemeSelector } from './components/ThemeSelector';
import { ErrorMessage } from './components/ErrorMessage';
import { getFriendlyErrorMessage } from './services/errorService';
import { ArtStyleSelector } from './components/ArtStyleSelector';
import { PageCountSelector } from './components/PageCountSelector';
import { ResumeSessionPrompt } from './components/ResumeSessionPrompt';

// Fix: Add types for the Web Speech API which are not standard in all TS lib versions.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [key: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}


// Note: This relies on browser's Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const STORAGE_KEY = 'gemini-storybook-session';

const createDynamicPrompt = (basePrompt: string, customizations: CustomizationState, title: string, book2Title: string, themes: string[], artStyle: string, pageCount: number): string => {
  const kinsleyDesc = customizations.kinsley.description;
  const ameliaDesc = `Amelia is 5 years old with ${customizations.amelia.hairColor.toLowerCase()} hair and a ${customizations.amelia.expression.toLowerCase()} expression. She is wearing a ${customizations.amelia.hatStyle.toLowerCase()} hat, and a ${customizations.amelia.cloakColor.toLowerCase()} ${customizations.amelia.cloakStyle.toLowerCase()} cloak over her ${customizations.amelia.outfit.toLowerCase()}. She holds a ${customizations.amelia.broomDesign.toLowerCase()} broom and carries a ${customizations.amelia.magicalAccessory.toLowerCase()}.`;
  const themesString = themes.length > 0 ? themes.join(', ') : 'magical and whimsical';
  const artStyleDesc = artStyles[artStyle as keyof typeof artStyles] || artStyles['Stop-Motion'];

  return basePrompt
    .replace(/\[STORY_TITLE\]/g, title)
    .replace(/\[BOOK_2_TITLE\]/g, book2Title)
    .replace(/\[STORY_THEMES\]/g, themesString)
    .replace(/\[ART_STYLE_DESCRIPTION\]/g, artStyleDesc)
    .replace(/\[KINSLEY_DESCRIPTION\]/g, kinsleyDesc)
    .replace(/\[AMELIA_DESCRIPTION\]/g, ameliaDesc)
    .replace(/\[PAGE_COUNT\]/g, pageCount.toString());
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
  const [artStyle, setArtStyle] = useState<string>('Stop-Motion');
  const [pageCount, setPageCount] = useState<number>(10);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const promptBeforeListening = useRef<string>('');

  // Session state
  const [sessionState, setSessionState] = useState<'checking' | 'prompt' | 'active'>('checking');

  // Check for saved session on initial load
  useEffect(() => {
    try {
        const savedSessionJSON = localStorage.getItem(STORAGE_KEY);
        if (savedSessionJSON) {
            const savedSession = JSON.parse(savedSessionJSON);
            // Check if there is meaningful data to load
            if (savedSession && (savedSession.prompt !== MASTER_PROMPT || savedSession.storybook)) {
                setSessionState('prompt');
                return;
            }
        }
    } catch (e) {
        console.error("Failed to check for saved session:", e);
    }
    setSessionState('active'); // No valid session found, start active
  }, []);

  // Auto-save session state when it changes
  useEffect(() => {
    if (sessionState === 'active') {
        try {
            const sessionData = {
                prompt, title, book2Title, storybook, customizations,
                uploadedImage, coverImage, selectedThemes, artStyle, pageCount
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        } catch (e) {
            console.error("Failed to save session:", e);
        }
    }
  }, [
      prompt, title, book2Title, storybook, customizations,
      uploadedImage, coverImage, selectedThemes, artStyle, pageCount, sessionState
  ]);

  const handleResumeSession = () => {
    playSound('success');
    try {
        const savedSessionJSON = localStorage.getItem(STORAGE_KEY);
        if (savedSessionJSON) {
            const saved = JSON.parse(savedSessionJSON);
            setPrompt(saved.prompt || MASTER_PROMPT);
            setTitle(saved.title || DEFAULT_STORY_TITLE);
            setBook2Title(saved.book2Title || DEFAULT_BOOK_2_TITLE);
            setStorybook(saved.storybook || null);
            setCustomizations(saved.customizations || defaultCustomizations);
            setUploadedImage(saved.uploadedImage || null);
            setCoverImage(saved.coverImage || null);
            setSelectedThemes(saved.selectedThemes || ['Magic', 'Friendship']);
            setArtStyle(saved.artStyle || 'Stop-Motion');
            setPageCount(saved.pageCount || 10);
        }
    } catch (e) {
        console.error("Failed to load saved session:", e);
        // If loading fails, just start a new session
        handleStartNewSession();
        return;
    }
    setSessionState('active');
  };

  const resetStateToDefaults = () => {
    setPrompt(MASTER_PROMPT);
    setTitle(DEFAULT_STORY_TITLE);
    setBook2Title(DEFAULT_BOOK_2_TITLE);
    setStorybook(null);
    setCustomizations(defaultCustomizations);
    setUploadedImage(null);
    setCoverImage(null);
    setSelectedThemes(['Magic', 'Friendship']);
    setArtStyle('Stop-Motion');
    setPageCount(10);
    setError(null);
    setIsLoading(false);
    setGenerationStatus('');
    setGenerationProgress(0);
  };

  const handleStartNewSession = () => {
      playSound('click');
      localStorage.removeItem(STORAGE_KEY);
      resetStateToDefaults();
      setSessionState('active');
  };

  const handleCreateNewStory = () => {
    playSound('click');
    localStorage.removeItem(STORAGE_KEY);
    resetStateToDefaults();
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim_transcript = '';
        let final_transcript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }
        
        const separator = promptBeforeListening.current.endsWith(' ') || promptBeforeListening.current === '' ? '' : ' ';
        setPrompt(promptBeforeListening.current + separator + final_transcript + interim_transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError({ title: "Voice Input Error", message: `An error occurred: ${event.error}. Please try again.` });
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleListen = () => {
    if (!isSpeechRecognitionSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      playSound('modalClose');
    } else {
      promptBeforeListening.current = prompt;
      recognitionRef.current.start();
      setIsListening(true);
      playSound('modalOpen');
    }
  };


  const handleThemeChange = (theme: string) => {
    playSound('click');
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };
  
  const handleArtStyleChange = (style: string) => {
    playSound('click');
    setArtStyle(style);
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

    const dynamicPrompt = createDynamicPrompt(prompt, customizations, title, book2Title, selectedThemes, artStyle, pageCount);

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
  }, [prompt, isLoading, customizations, uploadedImage, title, book2Title, coverImage, selectedThemes, artStyle, pageCount]);

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

  if (sessionState === 'checking') {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
             <div className="w-16 h-16 border-4 border-teal-400 border-dashed rounded-full animate-spin"></div>
        </div>
    );
  }
  
  if (sessionState === 'prompt') {
      return <ResumeSessionPrompt onResume={handleResumeSession} onStartNew={handleStartNewSession} />;
  }

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
                    setError={setError}
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
                <PaintBrushIcon className="w-6 h-6 mr-3" />
                Illustration Art Style
              </h2>
              <ArtStyleSelector selectedStyle={artStyle} onStyleChange={handleArtStyleChange} />
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
              
              <div className="mb-6">
                 <PageCountSelector
                    pageCount={pageCount}
                    onPageCountChange={setPageCount}
                 />
              </div>


              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="masterPrompt" className="block text-sm font-semibold text-slate-400">Master Story Prompt</label>
                  <button
                    onClick={handleToggleListen}
                    disabled={!isSpeechRecognitionSupported || isLoading}
                    className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      isListening
                        ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isSpeechRecognitionSupported ? (isListening ? 'Stop dictating' : 'Dictate with voice') : 'Voice input not supported by your browser'}
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                    {isListening && <span>Listening...</span>}
                  </button>
                </div>
                 <textarea
                    id="masterPrompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-64 bg-slate-900 text-gray-300 p-4 rounded-lg border-2 border-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                    placeholder="Enter your master story prompt here..."
                    disabled={isListening}
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
                onClick={handleCreateNewStory}
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