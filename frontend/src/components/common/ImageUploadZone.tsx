import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Star, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

export interface PhotoItem {
  id: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
}

interface ImageUploadZoneProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  photos,
  onChange,
  maxPhotos = 5,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const addedPhotos: PhotoItem[] = [];

    for (const file of newFiles) {
      if (photos.length + addedPhotos.length >= maxPhotos) {
        setErrorMessage(`Maximum limit of ${maxPhotos} photographs reached.`);
        break;
      }

      if (!validMimes.includes(file.type)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Please upload JPEG, PNG, or WebP.`);
        continue;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`"${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const isPrimary = photos.length === 0 && addedPhotos.length === 0;

      addedPhotos.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl,
        isPrimary,
      });
    }

    if (addedPhotos.length > 0) {
      onChange([...photos, ...addedPhotos]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = (file: File) => {
    validateAndAddFiles([file]);
  };

  const removePhoto = (id: string) => {
    const photoToRemove = photos.find(p => p.id === id);
    if (photoToRemove?.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }

    const updated = photos.filter(p => p.id !== id);
    // If we removed the primary photo, set the first remaining photo as primary
    if (photoToRemove?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const setPrimary = (id: string) => {
    const updated = photos.map(p => ({
      ...p,
      isPrimary: p.id === id,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-slate-800">
            Photographs <span className="text-xs font-normal text-slate-500">({photos.length}/{maxPhotos} uploaded)</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear photographs significantly improve ownership verification speed.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            disabled={photos.length >= maxPhotos}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition disabled:opacity-40"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Camera</span>
          </button>

          {/* Device Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Photo Grid Preview */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`relative group rounded-xl overflow-hidden aspect-square border-2 bg-slate-100 ${
                photo.isPrimary ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              <img
                src={photo.previewUrl}
                alt={`Uploaded #${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badges / Overlay */}
              {photo.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>COVER</span>
                </div>
              )}

              {/* Action buttons overlay */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(photo.id)}
                    title="Set as Primary Cover Photograph"
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full transition shadow-sm"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  title="Remove Photograph"
                  className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more placeholder slot if under max */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl aspect-square flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition bg-slate-50/50 hover:bg-blue-50/30"
            >
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Add Photo</span>
            </button>
          )}
        </div>
      ) : (
        /* Empty Upload Drop Area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition bg-white hover:bg-blue-50/30 group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Click to upload photographs, or drag and drop
          </p>
          <p className="text-xs text-slate-500 mt-1">
            JPEG, PNG, WebP up to 5MB each (Max 5 photos)
          </p>
        </div>
      )}

      {/* HTML5 Camera Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
