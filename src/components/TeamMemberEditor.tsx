import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, Trash2, Edit, Save, X, Upload } from 'lucide-react';
import { uploadProductImage } from '../services/supabase';

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

export function TeamMemberEditor() {
  const { state, reloadTeamMembers } = useApp();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [formData, setFormData] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (state.teamMembers) {
      setTeamMembers([...state.teamMembers].sort((a, b) => a.display_order - b.display_order));
    }
  }, [state.teamMembers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const imageUrl = await uploadProductImage(file, 'team');
      setFormData(prev => ({
        ...prev,
        image_url: imageUrl
      }));
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id || null);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio,
      image_url: member.image_url,
      display_order: member.display_order,
      is_active: member.is_active,
    });
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      bio: '',
      image_url: '',
      display_order: teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.display_order)) + 1 : 0,
      is_active: true,
    });
    setIsAddingNew(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      role: '',
      bio: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.role) {
      setError('Name and role are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      if (editingId) {
        await updateTeamMember(editingId, formData);
      } else {
        await addTeamMember(formData);
      }
      
      await reloadTeamMembers();
      handleCancel();
    } catch (err) {
      console.error('Error saving team member:', err);
      setError('Failed to save team member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      setIsLoading(true);
      await deleteTeamMember(id);
      await reloadTeamMembers();
    } catch (err) {
      console.error('Error deleting team member:', err);
      setError('Failed to delete team member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Meet the Team</h2>
        <button
          onClick={handleAddNew}
          className="bg-amber-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-amber-700 transition-colors"
          disabled={isLoading || isAddingNew}
        >
          <Plus size={18} /> Add Team Member
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {(isAddingNew || editingId) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Team Member' : 'Add New Team Member'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex items-center gap-4">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt={formData.name || 'Team member'} 
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium text-gray-700 inline-flex items-center gap-2">
                      <Upload size={16} />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      is_active: e.target.checked
                    }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0
                    }))}
                    className="w-24 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={16} />
                    {editingId ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No team members added yet.</p>
          </div>
        ) : (
          teamMembers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-lg shadow overflow-hidden border border-gray-200"
            >
              <div className="p-4 md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-4">
                  {member.image_url ? (
                    <img 
                      src={member.image_url} 
                      alt={member.name} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <User size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium">{member.name}</h3>
                    <p className="text-amber-600">{member.role}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{member.bio}</p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-gray-600 hover:text-amber-600 hover:bg-gray-100 rounded-full"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => member.id && handleDelete(member.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {!member.is_active && (
                <div className="bg-yellow-50 px-4 py-1 text-sm text-yellow-700 text-center">
                  Inactive - Not visible on the website
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper functions for CRUD operations
async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<void> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([member])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', id);
    
  if (error) throw error;
}

async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}
