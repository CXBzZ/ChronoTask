import React, { useState } from 'react';
import { X, Wand2, Loader2, RefreshCw } from 'lucide-react';
import { Todo } from '../types';
import { GoogleGenAI } from '@google/genai';

interface ImageEditorModalProps {
  todo: Todo;
  onClose: () => void;
  onSave: (newImage: string) => void;
}

export const ImageEditorModal = ({ todo, onClose, onSave }: ImageEditorModalProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !todo.image) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data and mime type
      const match = todo.image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid image format');
      
      const mimeType = match[1];
      const base64Data = match[2];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let newImageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          newImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (newImageUrl) {
        setPreviewImage(newImageUrl);
      } else {
        throw new Error('No image generated');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            AI Image Editor
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Image Preview Area */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative aspect-square md:aspect-auto md:flex-1 bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-sm font-medium text-zinc-600 animate-pulse">Applying AI magic...</p>
                </div>
              ) : null}
              
              <img
                src={previewImage || todo.image}
                alt="Original or edited"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            {previewImage && (
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                <span>✨ Image successfully edited!</span>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="flex items-center gap-1 hover:text-emerald-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Revert
                </button>
              </div>
            )}
          </div>

          {/* Controls Area */}
          <div className="w-full md:w-80 flex flex-col gap-4 shrink-0">
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                What would you like to change?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Add a retro filter, make it look like a watercolor painting, remove the background..."
                className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-zinc-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
              />
              
              {error && (
                <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-4 py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Edit
                  </>
                )}
              </button>
            </div>

            <div className="mt-auto flex gap-3 pt-4 border-t border-zinc-100">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-white border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (previewImage) onSave(previewImage);
                  else onClose();
                }}
                disabled={!previewImage}
                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
