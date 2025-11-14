import React, { useRef, useCallback } from 'react';
import { UploadIcon, XCircleIcon } from './Icons';
import { playSound } from '../services/soundService';

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageUpload: (base64Image: string) => void;
  onImageRemove: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ imagePreview, onImageUpload, onImageRemove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | undefined) => {
    if (!file) return;

    playSound('click');

    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      alert("File is too large. Please select an image under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageUpload(reader.result);
      }
    };
    reader.onerror = () => {
      alert("There was an error reading the file.");
    }
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleContainerClick = () => {
    if (!imagePreview) {
      fileInputRef.current?.click();
    }
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    processFile(event.dataTransfer.files?.[0]);
  }, [processFile]);

  return (
    <div 
        className={`relative w-full aspect-video rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center transition-all duration-300 ${!imagePreview ? 'hover:border-teal-500 hover:bg-slate-800/50 cursor-pointer' : ''}`}
        onClick={handleContainerClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />

      {imagePreview ? (
        <>
          <img
            src={imagePreview}
            alt="Character reference preview"
            className="object-contain w-full h-full rounded-md"
          />
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent container click
              playSound('modalClose');
              onImageRemove();
            }}
            className="absolute top-2 right-2 p-1 bg-slate-900/50 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            aria-label="Remove image"
          >
            <XCircleIcon className="w-8 h-8" />
          </button>
        </>
      ) : (
        <div className="text-center text-slate-400">
          <UploadIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Click to upload or drag & drop</p>
          <p className="text-sm text-slate-500">PNG, JPG, or WEBP (Max 4MB)</p>
        </div>
      )}
    </div>
  );
};