import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { uploadProductImage, supabase } from '../services/supabase';
import { TeamMemberEditor } from './TeamMemberEditor';
import { v4 as uuidv4 } from 'uuid';

// Define types locally since there seems to be an issue with the import
type AboutSection = {
  id: string;
  title: string;
  content: string;
  images: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Define a type for the current section being edited
type CurrentSection = Omit<AboutSection, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: any;
  }
}

export function AboutEditor() {
  const { state, updateAboutContent, reloadAboutContent } = useApp();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [currentSection, setCurrentSection] = useState<CurrentSection>({
    id: '',
    title: '',
    content: '',
    images: [],
    order: 0,
    isActive: true
  });
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize sections from state
  useEffect(() => {
    if (state.aboutContent) {
      // Safely access sections with type checking
      const aboutContent = state.aboutContent as unknown as { sections?: AboutSection[] };
      const aboutSections = aboutContent?.sections || [];
      const sortedSections = [...aboutSections].sort((a, b) => (a.order || 0) - (b.order || 0));
      setSections(sortedSections);
      
      // Set the first section as current if none is selected
      if (sortedSections.length > 0 && !currentSection.id) {
        setCurrentSection({
          ...sortedSections[0],
          images: sortedSections[0].images || []
        });
      }
    }
  }, [state.aboutContent, currentSection.id]);

  const handleImageUpload = async () => {
    if (!newImage) return;
    
    try {
      setIsUploading(true);
      setError('');
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload images');
      }
      
      const imageUrl = await uploadProductImage(newImage);
      
      setCurrentSection(prev => ({
        ...prev,
        images: [...(prev.images || []), imageUrl]
      }));
      
      setNewImage(null);
      setSuccessMessage('Image uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle section input changes
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setCurrentSection(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear any previous messages when user makes changes
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };
  
  // Handle image removal from the current section
  const handleRemoveImage = (index: number) => {
    setCurrentSection(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i: number) => i !== index)
    }));
  };

  const handleAddSection = () => {
    const newSection: AboutSection = {
      id: uuidv4(),
      title: '',
      content: '',
      images: [],
      order: sections.length,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentSection(newSection);
    setSections(prev => [...prev, newSection]);
  };

  const handleSelectSection = (section: AboutSection) => {
    setCurrentSection({
      ...section,
      images: section.images || []
    });
    setError('');
    setSuccessMessage('');
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section? This cannot be undone.')) {
      return;
    }
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to delete sections');
      }
      
      const updatedSections = sections.filter(section => section.id !== id);
      // Update the sections in the database
      const aboutContent = { sections: updatedSections } as unknown as Record<string, unknown>;
      await updateAboutContent('about', aboutContent);
      setSections(updatedSections);
      setSuccessMessage('Section deleted successfully');
      
      // Reset current section if it was the one deleted
      if (currentSection.id === id) {
        setCurrentSection({
          id: '',
          title: '',
          content: '',
          images: [],
          order: updatedSections.length,
          isActive: true
        });
      }
      
      // Reload to ensure we have the latest data
      await reloadAboutContent();
    } catch (err: any) {
      setError(err.message || 'Failed to delete section. Please try again.');
      console.error('Error deleting section:', err);
    }
  };

  const handleSaveChanges = async () => {
    if (isUploading) return; // Prevent multiple submissions
    
    try {
      setError('');
      setSuccessMessage('');
      setIsUploading(true);
      
      // Validate required fields
      if (!currentSection.title?.trim()) {
        throw new Error('Title is required');
      }
      
      if (!currentSection.content?.trim()) {
        throw new Error('Content is required');
      }
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError?.message || 'No active session');
        throw new Error('You must be logged in to update the about content. Please sign in and try again.');
      }
      
      // Prepare the section data with proper types
      const sectionData: AboutSection = {
        id: currentSection.id || uuidv4(),
        title: currentSection.title.trim(),
        content: currentSection.content.trim(),
        images: currentSection.images || [],
        order: currentSection.order || 0,
        isActive: currentSection.isActive !== false,
        createdAt: currentSection.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update or add the section
      const updatedSections = currentSection.id
        ? sections.map(section => section.id === currentSection.id ? sectionData : section)
        : [...sections, sectionData];
      
      // Save to database - update the about content with the full content structure
      const aboutContent = { sections: updatedSections } as unknown as Record<string, unknown>;
      const result = await updateAboutContent('about', aboutContent);
      
      if (result.success) {
        setSections(updatedSections);
        setSuccessMessage('Section saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // If this was a new section, update the current section with the saved data
        if (!currentSection.id) {
          setCurrentSection(sectionData);
        }
      } else {
        throw new Error(result.error || 'Failed to save section');
      }
    } catch (err: any) {
      console.error('Error saving about content:', err);
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('about');
  
  // Show loading state while initializing
  if (!state.aboutContent) {
    return <div className="p-8 text-center text-gray-600">Loading about content...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar for section navigation */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sections</h2>
            <button
              onClick={handleAddSection}
              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              title="Add New Section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => handleSelectSection(section)}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    currentSection.id === section.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium truncate">
                    {section.title || 'Untitled Section'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {section.content.substring(0, 50)}{section.content.length > 50 ? '...' : ''}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {currentSection.id ? 'Edit Section' : 'New Section'}
            </h2>
            {currentSection.id && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteSection(currentSection.id!)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                  disabled={isUploading}
                >
                  Delete Section
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isUploading}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
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
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>}
      
      <div className="space-y-6">
        {activeTab === 'about' ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={currentSection.title || ''}
                onChange={handleSectionChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Section Title"
                disabled={isUploading}
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                value={currentSection.content || ''}
                onChange={handleSectionChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter content"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {(currentSection.images || []).map((img: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`About ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSection(prev => ({
                          ...prev,
                          images: (prev.images || []).filter((_, i) => i !== index)
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isUploading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="file"
                  id="newImage"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="newImage"
                  className="px-4 py-2 border border-gray-300 rounded-l-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Choose Image
                </label>
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={!newImage || isUploading}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              {newImage && (
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {newImage.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <button
                onClick={handleSaveChanges}
                disabled={isUploading}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <TeamMemberEditor />
          </div>
        )}
      </div>
    </div>
  );
}