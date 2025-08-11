import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Move } from 'lucide-react';
import { validateImage, validateImageDimensions, compressImage, generateThumbnail, ImageFile } from '../utils/imageUtils';

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, className = '' }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList) => {
    const newImages: ImageFile[] = [];
    
    for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
      const file = files[i];
      const imageId = `img-${Date.now()}-${i}`;
      
      // Basic validation
      const validation = validateImage(file);
      if (!validation.isValid) {
        newImages.push({
          id: imageId,
          file,
          preview: '',
          error: validation.error,
        });
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const imageFile: ImageFile = {
        id: imageId,
        file,
        preview,
        isUploading: true,
      };
      
      newImages.push(imageFile);
    }

    // Update images immediately with loading state
    onImagesChange([...images, ...newImages]);

    // Process each image asynchronously
    for (const imageFile of newImages) {
      if (imageFile.error) continue;

      try {
        // Validate dimensions
        const dimensionValidation = await validateImageDimensions(imageFile.file);
        if (!dimensionValidation.isValid) {
          updateImageError(imageFile.id, dimensionValidation.error!);
          continue;
        }

        // Compress image
        const compressedFile = await compressImage(imageFile.file);
        
        // Generate thumbnail
        const thumbnail = await generateThumbnail(compressedFile);
        
        // Update the image with processed data
        updateImageSuccess(imageFile.id, compressedFile, thumbnail);
        
      } catch (error) {
        updateImageError(imageFile.id, 'Failed to process image');
      }
    }
  }, [images, maxImages, onImagesChange]);

  const updateImageError = (id: string, error: string) => {
    onImagesChange(prev => prev.map(img => 
      img.id === id ? { ...img, error, isUploading: false } : img
    ));
  };

  const updateImageSuccess = (id: string, file: File, thumbnail: string) => {
    onImagesChange(prev => prev.map(img => 
      img.id === id ? { ...img, file, preview: thumbnail, isUploading: false } : img
    ));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove && imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    onImagesChange(images.filter(img => img.id !== id));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-amber-400 bg-amber-50'
            : 'border-gray-300 hover:border-amber-400'
        } ${images.length >= maxImages ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop images here or click to upload
        </p>
        <p className="text-sm text-gray-600 mb-4">
          JPG, PNG, WebP up to 5MB • Minimum 800x800px
        </p>
        <p className="text-xs text-gray-500">
          {images.length} of {maxImages} images uploaded
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
              >
                {image.isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : image.error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-600 p-2">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-xs text-center">{image.error}</p>
                  </div>
                ) : (
                  <>
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Controls */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(index, index - 1);
                            }}
                            className="p-1 bg-white rounded-full text-gray-600 hover:text-gray-900"
                            title="Move left"
                          >
                            <Move className="h-4 w-4 rotate-180" />
                          </button>
                        )}
                        
                        {index < images.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveImage(index, index + 1);
                            }}
                            className="p-1 bg-white rounded-full text-gray-600 hover:text-gray-900"
                            title="Move right"
                          >
                            <Move className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="p-1 bg-white rounded-full text-red-600 hover:text-red-800"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Primary Image Indicator */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}