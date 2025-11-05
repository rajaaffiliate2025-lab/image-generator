
import React, { useState, useCallback } from 'react';
import { editImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const UploadIcon: React.FC = () => (
  <svg className="w-12 h-12 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MagicWandIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  originalImageSrc: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, originalImageSrc }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="cursor-pointer group">
        <div className="mt-1 flex justify-center items-center h-48 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md group-hover:border-indigo-500 transition-colors">
          <div className="space-y-1 text-center">
            {originalImageSrc ? (
              <img src={originalImageSrc} alt="Original" className="mx-auto max-h-40 w-auto object-contain rounded-md" />
            ) : (
              <>
                <UploadIcon />
                <div className="flex text-sm text-gray-600">
                  <span className="relative bg-white rounded-md font-medium text-indigo-600 group-hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    Upload an image
                  </span>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
              </>
            )}
          </div>
        </div>
      </label>
      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
    </div>
  );
};

function App() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [editedImageSrc, setEditedImageSrc] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setEditedImageSrc(null);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageSrc(null);

    try {
      const { base64, mimeType } = await fileToBase64(originalImage);
      const generatedImageBase64 = await editImage(base64, mimeType, prompt);
      setEditedImageSrc(`data:${mimeType};base64,${generatedImageBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Gemini <span className="text-indigo-600">Image Editor</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            Edit your images with the power of AI. Just upload an image, describe your change, and let Gemini work its magic.
          </p>
        </header>

        <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Upload Image</h2>
                <ImageUploader onImageUpload={handleImageUpload} originalImageSrc={originalImageSrc} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Describe Your Edit</h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Add a retro filter', 'Make the sky purple'"
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm h-28 resize-none"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !originalImage || !prompt}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <MagicWandIcon />
                    Generate Edit
                  </>
                )}
              </button>
            </div>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Result</h2>
              <div className="w-full aspect-square bg-gray-100 rounded-md flex items-center justify-center border border-gray-200 overflow-hidden">
                {isLoading && (
                  <div className="text-center text-gray-500">
                    <svg className="animate-spin mx-auto h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 font-medium">Editing your image...</p>
                  </div>
                )}
                {!isLoading && !editedImageSrc && (
                   <p className="text-gray-500 text-center p-4">Your generated image will appear here.</p>
                )}
                {editedImageSrc && (
                  <img src={editedImageSrc} alt="Edited" className="w-full h-full object-contain" />
                )}
              </div>
            </div>
          </div>
          {error && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </main>
        <footer className="text-center mt-8 text-sm text-gray-500">
            <p>Powered by Google Gemini 2.5 Flash Image</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
