import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { uploadProductImage } from '../services/supabase';
import { TeamMemberEditor } from './TeamMemberEditor';

export function AboutEditor() {
  const { state, updateAboutContent, reloadAboutContent } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (state.aboutContent) {
      setTitle(state.aboutContent.title);
      setContent(state.aboutContent.content);
      setImages(state.aboutContent.images);
    }
  }, [state.aboutContent]);

  const handleImageUpload = async () => {
    if (!newImage) return;
    setIsUploading(true);
    try {
      const imageUrl = await uploadProductImage(newImage);
      setImages([...images, imageUrl]);
      setNewImage(null);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      setIsUploading(true);
      
      // If we have existing content, update it. Otherwise, create new content.
      const contentId = state.aboutContent?.id || 'default';
      
      // Show loading state
      const saveButton = document.querySelector('button[onClick*="handleSaveChanges"]');
      if (saveButton) saveButton.textContent = 'Saving...';
      
      await updateAboutContent(contentId, { 
        title: title.trim(), 
        content: content.trim(), 
        images 
      });
      
      // Show success message
      setError('');
      alert('Changes saved successfully!');
      
      // Refresh the about content to ensure we have the latest version
      await reloadAboutContent();
    } catch (err: any) {
      console.error('Error saving about content:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsUploading(false);
      // Restore button text
      const saveButton = document.querySelector('button[onClick*="handleSaveChanges"]');
      if (saveButton) saveButton.textContent = 'Save Changes';
    }
  };

  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">About Page Editor</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'about'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            About Content
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'team'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Team Members
          </button>
        </div>
      </div>
      
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="space-y-6">
        {activeTab === 'about' ? (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt={`About image ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files ? e.target.files[0] : null)}
                  className="w-full"
                />
                <button
                  onClick={handleImageUpload}
                  disabled={!newImage || isUploading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-4 disabled:bg-gray-400"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={handleSaveChanges}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700"
              >
                Save Changes
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <TeamMemberEditor />
          </div>
        )}
      </div>
    </div>
  );
}