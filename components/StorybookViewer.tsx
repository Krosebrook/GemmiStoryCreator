import React, { useState, useEffect } from 'react';
import { StoryPage } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, ArrowPathIcon, CodeBracketIcon } from './Icons';
import { RegenerationPromptModal } from './RegenerationPromptModal';
import { playSound } from '../services/soundService';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

interface StorybookViewerProps {
  pages: StoryPage[];
  title: string;
  coverImageUrl: string | null;
  onRegenerate: (pageNumber: number, customPrompt: string) => Promise<void>;
  regeneratingPage: number | null;
}

const createPageHtml = (title: string, imageUrl: string | null, pageText: string | null, pageNumber: string) => {
  const altText = pageNumber === 'Cover' 
    ? `Cover image for "${title}"` 
    : `Illustration for ${pageNumber.toLowerCase()}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${pageNumber}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      background-color: #0f172a; /* bg-slate-900 */
      color: #e2e8f0; /* bg-slate-200 */
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
    .container {
      width: 100%;
      max-width: 1280px;
      aspect-ratio: 16 / 9;
      position: relative;
      background-color: #1e293b; /* bg-slate-800 */
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
    }
    .text-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 64px 24px 24px;
      text-align: center;
      background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.6), transparent);
      color: white;
      font-size: 1.25rem;
      line-height: 1.75rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
    }
    .title-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background-color: rgba(0,0,0,0.4);
    }
    .title-text {
        font-size: 4rem;
        font-weight: bold;
        color: white;
        text-align: center;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
    }
    .no-image-placeholder {
        color: #64748b; /* text-slate-500 */
        font-size: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    ${imageUrl ? `<img src="${imageUrl}" alt="${altText}">` : '<div class="no-image-placeholder">Illustration not available</div>'}
    ${pageText ? `<div class="text-overlay"><p>${pageText}</p></div>` : ''}
    ${!pageText && pageNumber === 'Cover' ? `<div class="title-overlay"><h1 class="title-text">${title}</h1></div>` : ''}
  </div>
</body>
</html>
`;
};

export const StorybookViewer: React.FC<StorybookViewerProps> = ({ pages, title, coverImageUrl, onRegenerate, regeneratingPage }) => {
  const hasCover = !!coverImageUrl;
  const [currentPage, setCurrentPage] = useState(hasCover ? -1 : 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [editingPromptForPage, setEditingPromptForPage] = useState<StoryPage | null>(null);

  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    const imageUrl = currentPage === -1 ? coverImageUrl : pages[currentPage]?.imageUrl;

    if (imageUrl) {
        img.src = imageUrl;
        img.onload = () => setImageLoaded(true);
    } else {
        setImageLoaded(true); // No image to load
    }
  }, [currentPage, pages, coverImageUrl]);

  const handleConfirmRegeneration = (newPrompt: string) => {
    if (editingPromptForPage) {
      onRegenerate(editingPromptForPage.page_number, newPrompt);
      setEditingPromptForPage(null);
    }
  };

  const handlePdfExport = async () => {
    playSound('click');
    if (isExportingPdf) return;
    setIsExportingPdf(true);
  
    try {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1280, 720], // 16:9 aspect ratio
            hotfixes: ["px_scaling"],
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
    
        // Add cover page if it exists
        if (hasCover && coverImageUrl) {
            doc.addImage(coverImageUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
            
            // Add title text over the cover
            doc.setFontSize(60);
            doc.setFont('times', 'bold');
            doc.setTextColor('#FFFFFF');
            doc.text(title, pageWidth / 2, pageHeight / 2, { 
                align: 'center',
                maxWidth: pageWidth - 80 // Add some margin
            });
        }

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            
            // Add a new page for each story page
            if (hasCover || i > 0) {
              doc.addPage();
            }
            
            if (page.imageUrl) {
                doc.addImage(page.imageUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
            } else {
                doc.setFillColor(23, 37, 84); // bg-slate-800
                doc.rect(0, 0, pageWidth, pageHeight, 'F');
            }
    
            const text = page.text;
            const textMargin = 40;
            const textWidth = pageWidth - (textMargin * 2);
            
            doc.setFontSize(24);
            doc.setFont('times', 'normal');
            doc.setTextColor('#FFFFFF');
            
            const splitText = doc.splitTextToSize(text, textWidth);
            const textMetrics = doc.getTextDimensions(splitText);
            const textHeight = textMetrics.h;
            
            const textY = pageHeight - textHeight - 20;
    
            // Semi-transparent background for text
            doc.setFillColor(0, 0, 0, 0.6);
            doc.rect(0, textY - 15, pageWidth, textHeight + 30, 'F');
            
            doc.text(splitText, pageWidth / 2, textY, { align: 'center' });
        }
    
        const safeTitle = title.trim().toLowerCase().replace(/[\s\W-]+/g, '_').substring(0, 50) || 'storybook';
        doc.save(`${safeTitle}.pdf`);
    } catch (e) {
        console.error("Failed to generate PDF:", e);
        alert("Sorry, there was an error creating the PDF. Please check the console for details.");
    } finally {
        setIsExportingPdf(false);
    }
  };

  const handleZipExport = async () => {
      playSound('click');
      if (isExportingZip) return;
      setIsExportingZip(true);
      
      try {
        const zip = new JSZip();

        if (hasCover && coverImageUrl) {
            const base64Data = coverImageUrl.split(',')[1];
            zip.file('cover.jpeg', base64Data, { base64: true });
        }

        for (const page of pages) {
            if (page.imageUrl) {
                const base64Data = page.imageUrl.split(',')[1];
                const fileName = `page_${String(page.page_number).padStart(2, '0')}.jpeg`;
                zip.file(fileName, base64Data, { base64: true });
            }
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        const safeTitle = title.trim().toLowerCase().replace(/[\s\W-]+/g, '_').substring(0, 50) || 'storybook';
        link.download = `${safeTitle}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (e) {
          console.error("Failed to generate ZIP:", e);
          alert("Sorry, there was an error creating the ZIP file. Please check the console for details.");
      } finally {
        setIsExportingZip(false);
      }
  };

  const handleHtmlExport = async () => {
    playSound('click');
    if (isExportingHtml) return;
    setIsExportingHtml(true);
    
    try {
        const zip = new JSZip();
        const safeTitle = title.trim().toLowerCase().replace(/[\s\W-]+/g, '_').substring(0, 50) || 'storybook';

        // Add cover page if it exists
        if (hasCover && coverImageUrl) {
            const coverHtml = createPageHtml(title, coverImageUrl, null, 'Cover');
            zip.file('cover.html', coverHtml);
        }

        // Add story pages
        for (const page of pages) {
            const pageHtml = createPageHtml(title, page.imageUrl || null, page.text, `Page ${page.page_number}`);
            const fileName = `page_${String(page.page_number).padStart(2, '0')}.html`;
            zip.file(fileName, pageHtml);
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${safeTitle}_html.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (e) {
        console.error("Failed to generate HTML ZIP:", e);
        alert("Sorry, there was an error creating the HTML files. Please check the console for details.");
    } finally {
        setIsExportingHtml(false);
    }
  };

  const goToNextPage = () => {
    playSound('pageTurn');
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const goToPrevPage = () => {
    playSound('pageTurn');
    setCurrentPage((prev) => Math.max(prev - 1, hasCover ? -1 : 0));
  };

  const isCoverPage = currentPage === -1;
  const page = !isCoverPage ? pages[currentPage] : null;
  const isCurrentPageRegenerating = !isCoverPage && regeneratingPage === page?.page_number;
  const currentImageUrl = isCoverPage ? coverImageUrl : page?.imageUrl;

  return (
    <div className="w-full max-w-5xl flex flex-col items-center animate-fade-in">
      <div className="w-full aspect-video bg-slate-800 rounded-2xl border-4 border-slate-700 shadow-2xl overflow-hidden mb-6 relative flex items-center justify-center">
        {!imageLoaded && !isCurrentPageRegenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-20">
             <div className="w-16 h-16 border-4 border-teal-400 border-dashed rounded-full animate-spin"></div>
          </div>
        )}
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={isCoverPage ? `Cover for ${title}` : `Illustration for page ${page?.page_number}`}
            className={`object-cover w-full h-full transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
            <div className="text-slate-500">{ isCoverPage ? 'Cover image not available' : 'Illustration not available' }</div>
        )}
        
        {isCoverPage && (
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/40">
                <h2 className="text-4xl md:text-6xl font-bold text-white text-center" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                    {title}
                </h2>
            </div>
        )}

        {isCurrentPageRegenerating && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 transition-opacity duration-300">
              <div className="w-16 h-16 border-4 border-purple-400 border-dashed rounded-full animate-spin"></div>
              <p className="mt-4 text-lg font-semibold text-slate-300">Summoning new art...</p>
          </div>
        )}

        {/* Text Overlay */}
        {!isCoverPage && page && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 pt-16 text-center z-10">
              <p
                className="text-lg md:text-xl leading-relaxed text-white font-serif story-text-glow"
              >
                  {page.text}
              </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full max-w-md">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === (hasCover ? -1 : 0) || regeneratingPage !== null}
          className="p-3 bg-slate-700 rounded-full text-gray-200 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg text-slate-400">
          {isCoverPage ? 'Cover' : `Page ${currentPage + 1} of ${pages.length}`}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === pages.length - 1 || regeneratingPage !== null}
          className="p-3 bg-slate-700 rounded-full text-gray-200 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-8 border-t border-slate-700 pt-6 w-full flex flex-col md:flex-row items-center justify-center gap-4">
        {!isCoverPage && (
            <button
                onClick={() => {
                  if (page) {
                    playSound('modalOpen');
                    setEditingPromptForPage(page);
                  }
                }}
                disabled={regeneratingPage !== null || !page?.imageUrl}
                className="px-6 py-2 bg-slate-800 text-slate-300 font-semibold rounded-full hover:bg-green-600 border border-slate-600 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Regenerate Image
            </button>
        )}
        <button
            onClick={handlePdfExport}
            disabled={isExportingPdf || isExportingZip || isExportingHtml || regeneratingPage !== null}
            className="px-6 py-2 bg-slate-800 text-slate-300 font-semibold rounded-full hover:bg-teal-600 border border-slate-600 hover:border-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            <DownloadIcon className="w-5 h-5 mr-2"/>
            {isExportingPdf ? 'Creating PDF...' : 'Download as PDF'}
        </button>
        <button
            onClick={handleZipExport}
            disabled={isExportingPdf || isExportingZip || isExportingHtml || regeneratingPage !== null}
            className="px-6 py-2 bg-slate-800 text-slate-300 font-semibold rounded-full hover:bg-purple-600 border border-slate-600 hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            <DownloadIcon className="w-5 h-5 mr-2"/>
            {isExportingZip ? 'Zipping Images...' : 'Download Images (.zip)'}
        </button>
        <button
            onClick={handleHtmlExport}
            disabled={isExportingPdf || isExportingZip || isExportingHtml || regeneratingPage !== null}
            className="px-6 py-2 bg-slate-800 text-slate-300 font-semibold rounded-full hover:bg-blue-600 border border-slate-600 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
            <CodeBracketIcon className="w-5 h-5 mr-2"/>
            {isExportingHtml ? 'Creating HTML...' : 'Download as HTML (.zip)'}
        </button>
      </div>
      {editingPromptForPage && (
        <RegenerationPromptModal
            page={editingPromptForPage}
            onConfirm={handleConfirmRegeneration}
            onCancel={() => setEditingPromptForPage(null)}
            isRegenerating={regeneratingPage !== null}
        />
      )}
    </div>
  );
};

// Add fade-in animation to tailwind config (or in a style tag if no config is present)
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInFast {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes glow {
    0%, 100% {
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.4), 2px 2px 6px rgba(0,0,0,0.7);
    }
    50% {
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 2px 2px 6px rgba(0,0,0,0.7);
    }
  }
  .animate-fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
  .animate-fade-in-fast {
    animation: fadeInFast 0.3s ease-out forwards;
  }
  .story-text-glow {
    animation: glow 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);