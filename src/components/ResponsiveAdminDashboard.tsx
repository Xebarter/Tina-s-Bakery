import React, { useState, useEffect, useContext } from 'react';
import { 
  Menu, 
  X, 
  BarChart3, 
  Package, 
  Users, 
  ShoppingBag, 
  Edit3,
  Trash2,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Clock,
  Filter
} from 'lucide-react';
import { AppContext, AppContextType } from '../contexts/AppContext';
import { Product, Category, Order } from '../types';
import { AboutEditor } from './AboutEditor';
import { OrderManagement } from './OrderManagement';
import { CustomerManagementDashboard } from './CustomerManagementDashboard';
import { formatUGX } from '../utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { uploadProductImage } from '../services/supabase';
import { compressImage } from '../utils/imageUtils';

// Modal component for dialogs
const Modal = ({ isOpen, onClose, children, title }: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode; 
  title: string 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (cat: { name: string; slug: string; description?: string }) => void;
  onEdit: (id: string, updates: { name: string; slug: string; description?: string }) => void;
  onDelete: (id: string) => void;
}

function CategoryManager({ categories, onAdd, onEdit, onDelete }: CategoryManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <button 
          onClick={() => { setShowAdd(!showAdd); setAddError(''); }} 
          className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          {showAdd ? 'Cancel' : 'Add Category'}
        </button>
      </div>
      
      {showAdd && (
        <form onSubmit={(e) => {
          e.preventDefault();
          setAddError('');
          const name = newName.trim();
          if (!name) {
            setAddError('Category name is required.');
            return;
          }
          if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            setAddError('A category with this name already exists.');
            return;
          }
          const slug = slugify(name);
          onAdd({ name, slug, description: newDesc.trim() });
          setNewName('');
          setNewDesc('');
          setShowAdd(false);
        }} className="flex flex-col sm:flex-row gap-2">
          <input 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder="Category name" 
            className="border rounded px-3 py-2 flex-1" 
            required 
          />
          <input 
            value={newDesc} 
            onChange={(e) => setNewDesc(e.target.value)} 
            placeholder="Description (optional)" 
            className="border rounded px-3 py-2 flex-1" 
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">
            Save
          </button>
          {addError && <div className="text-red-600 text-sm mt-2 w-full">{addError}</div>}
        </form>
      )}
      
      <div className="bg-white rounded-lg shadow p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: Category) => (
              <tr key={cat.id}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {editId === cat.id ? (
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="border rounded px-2 py-1" 
                    />
                  ) : cat.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {editId === cat.id ? (
                    <input 
                      value={editDesc} 
                      onChange={(e) => setEditDesc(e.target.value)} 
                      className="border rounded px-2 py-1" 
                    />
                  ) : cat.description}
                </td>
                <td className="px-4 py-2 whitespace-nowrap space-x-2">
                  {editId === cat.id ? (
                    <>
                      {editError && <div className="text-red-600 text-sm mb-1">{editError}</div>}
                      <button 
                        onClick={() => {
                          setEditError('');
                          const name = editName.trim();
                          if (!name) { 
                            setEditError('Category name is required.'); 
                            return; 
                          }
                          if (categories.some((cat2: Category) => cat2.id !== cat.id && cat2.name.toLowerCase() === name.toLowerCase())) {
                            setEditError('A category with this name already exists.'); 
                            return;
                          }
                          const slug = slugify(name);
                          onEdit(cat.id, { name, slug, description: editDesc.trim() });
                          setEditId(null);
                        }} 
                        className="text-green-600 font-medium"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditId(null)} className="text-gray-600 font-medium">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { 
                          setEditId(cat.id); 
                          setEditName(cat.name); 
                          setEditDesc(cat.description || ''); 
                          setEditError(''); 
                        }} 
                        className="text-blue-600 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(cat.id)} 
                        className="text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResponsiveAdminDashboard() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('ResponsiveAdminDashboard must be used within an AppProvider');
  }

  const { state, createProduct, editProduct, removeProduct, createCategory, editCategory, removeCategory } = context;
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const menuItems = [
    { id: 'overview', name: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
    { id: 'about-editor', name: 'About Editor', icon: Edit3, color: 'text-amber-600' },
    { id: 'products', name: 'Products', icon: Package, color: 'text-green-600' },
    { id: 'categories', name: 'Categories', icon: Filter, color: 'text-orange-600' },
    { id: 'orders', name: 'Orders', icon: ShoppingBag, color: 'text-purple-600' },
    { id: 'customers', name: 'Customers', icon: Users, color: 'text-pink-600' },
  ];

  const handleTabChange = (tabId: string) => {
    setIsLoading(true);
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    
    setTimeout(() => setIsLoading(false), 200);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to exit admin mode?')) {
      // This should be handled by context dispatch
      console.log('Logging out...');
    }
  };

  const totalSales = state.orders.reduce((sum: number, order: Order) => sum + (order.total * 130), 0);
  const totalOrders = state.orders.length;
  const totalCustomers = state.customers.length;
  const recentOrders = [...state.orders]
    .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const pendingOrders = state.orders.filter((order: Order) => order.status === 'pending').length;
  const completedOrders = state.orders.filter((order: Order) => order.status === 'delivered').length;

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<(Product & { imageFile?: File | null }) | null>(null);
  const topSellingProducts = [...state.products]
    .sort((a: Product, b: Product) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5);
  
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { 
    imageFile?: File | null 
  }>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image: '',
    inStock: true,
    inventory: 0,
    featured: false,
    isSignatureProduct: false,
    isSeasonalSpecial: false,
    display_settings: {
      badges: [],
    },
  });
  
  const [formError, setFormError] = useState('');
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleImageUpload = async (file: File): Promise<string> => {
    if (!file) return '';
    return await uploadProductImage(file);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'about-editor':
        return <AboutEditor />;
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, Admin</h2>
                  <p className="text-amber-100">Here's what's happening with your bakery today</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-100">Today</p>
                  <p className="text-xl font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUGX(totalSales)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="text-right">
                    {pendingOrders > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {recentOrders.map((order, index) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatUGX(order.total)}</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={() => handleTabChange('about-editor')}
                      className="w-full flex items-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group"
                    >
                      <div className="p-2 bg-amber-600 rounded-lg mr-4">
                        <Edit3 className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-amber-700">Edit About</p>
                        <p className="text-sm text-gray-600">Update your story</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('products')}
                      className="w-full flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                    >
                      <div className="p-2 bg-green-600 rounded-lg mr-4">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-green-700">Manage Products</p>
                        <p className="text-sm text-gray-600">Add or edit items</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTabChange('orders')}
                      className="w-full flex items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                    >
                      <div className="p-2 bg-purple-600 rounded-lg mr-4">
                        <ShoppingBag className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 group-hover:text-purple-700">Process Orders</p>
                        <p className="text-sm text-gray-600">Manage order queue</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Orders</span>
                      <span className="text-sm font-semibold text-gray-900">{pendingOrders}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
              <button
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                onClick={() => setShowAddProductModal(true)}
              >
                Add New Product
              </button>
            </div>
            
            {showAddSuccess && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
                <div className="bg-green-500 text-white text-center py-3 rounded-lg shadow-lg font-semibold text-lg">
                  Product added successfully
                </div>
              </div>
            )}
            
            <Modal isOpen={showAddProductModal} onClose={() => { 
              setShowAddProductModal(false); 
              setFormError(''); 
            }} title="Add New Product">
              {formError && <div className="text-red-600 mb-2 text-sm">{formError}</div>}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
                  <div className="flex flex-col items-center">
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none" stroke="#e5e7eb" strokeWidth="8"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke={uploadStatus === 'error' ? '#dc2626' : '#22c55e'}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={
                          uploadStatus === 'uploading'
                            ? 2 * Math.PI * 28 * 0.75
                            : 0
                        }
                        style={{
                          transition: uploadStatus === 'success' ? 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' : undefined,
                          transformOrigin: 'center',
                          animation: uploadStatus === 'uploading' ? 'spin-circular 1.2s linear infinite' : undefined,
                        }}
                      />
                      {uploadStatus === 'success' && (
                        <polyline
                          points="20,34 30,44 46,24"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {uploadStatus === 'error' && (
                        <line x1="22" y1="22" x2="42" y2="42" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
                      )}
                    </svg>
                    <div className="mt-4 text-lg font-semibold text-gray-700">
                      {uploadStatus === 'uploading' && 'Uploading...'}
                      {uploadStatus === 'success' && 'Product added!'}
                      {uploadStatus === 'error' && 'Upload failed'}
                    </div>
                  </div>
                </div>
              )}
              
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsUploading(true);
                  setUploadStatus('uploading');
                  setFormError('');
                  
                  try {
                    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.inventory || (!newProduct.image && !newProduct.imageFile)) {
                      setFormError('All fields are required.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }
                    
                    if (isNaN(Number(newProduct.price)) || isNaN(Number(newProduct.inventory))) {
                      setFormError('Price and inventory must be numbers.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }
                    
                    let imagePath = newProduct.image;
                    if (newProduct.imageFile) {
                      try {
                        const compressed = await compressImage(newProduct.imageFile, 0.7);
                        imagePath = await handleImageUpload(compressed);
                      } catch (error) {
                        console.error('Image upload failed:', error);
                        setFormError('Failed to upload image. Please try again.');
                        setIsUploading(false);
                        setUploadStatus('error');
                        return;
                      }
                    }
                    
                    const categoryId = newProduct.category_id || 
                                     (state.categories.length > 0 ? state.categories[0].id : '');
                    
                    if (!categoryId) {
                      setFormError('Please select a valid category.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }
                    
                    const productData: Product = {
                      id: uuidv4(),
                      name: newProduct.name.trim(),
                      description: newProduct.description.trim(),
                      price: parseFloat(Number(newProduct.price).toFixed(2)),
                      category_id: categoryId,
                      image: imagePath,
                      inStock: Boolean(newProduct.inStock),
                      inventory: parseInt(String(newProduct.inventory), 10),
                      featured: false,
                      isSeasonalSpecial: Boolean(newProduct.isSeasonalSpecial),
                      isSignatureProduct: Boolean(newProduct.isSignatureProduct),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      slug: slugify(newProduct.name)
                    };
                    
                    if (typeof createProduct === 'function') {
                      try {
                        await createProduct(productData);
                        setUploadStatus('success');
                        
                        setTimeout(() => {
                          setIsUploading(false);
                          setShowAddProductModal(false);
                          setShowAddSuccess(true);
                          
                          setNewProduct({
                            name: '',
                            description: '',
                            price: 0,
                            category_id: state.categories[0]?.id || '',
                            image: '',
                            inStock: true,
                            inventory: 0,
                            featured: false,
                            isSignatureProduct: false,
                            isSeasonalSpecial: false,
                            display_settings: {
                              badges: [],
                            },
                          });
                          setUploadStatus('idle');
                        }, 1000);
                      } catch (error) {
                        console.error('Error adding product:', error);
                        setFormError('Failed to add product. Please try again.');
                        setIsUploading(false);
                        setUploadStatus('error');
                      }
                    } else {
                      console.error('createProduct function is not available');
                      setFormError('System error: Unable to add product. Please refresh and try again.');
                      setIsUploading(false);
                      setUploadStatus('error');
                    }
                  } catch (error) {
                    console.error('Error adding product:', error);
                    setFormError('Failed to add product. Please try again.');
                    setIsUploading(false);
                    setUploadStatus('error');
                    setTimeout(() => setUploadStatus('idle'), 2000);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                style={isUploading ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.name} 
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} 
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.description} 
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price (UGX)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.price} 
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.category_id || ''} 
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  >
                    <option value="" disabled>Select category</option>
                    {state.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="w-full" 
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) setNewProduct({ ...newProduct, imageFile: files[0], image: '' });
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="or paste image URL" 
                    className="w-full border rounded px-3 py-2 mt-2" 
                    value={newProduct.image} 
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value, imageFile: null })} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Inventory</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.inventory} 
                    onChange={(e) => setNewProduct({ ...newProduct, inventory: Number(e.target.value) })} 
                  />
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={newProduct.inStock} 
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })} 
                    id="inStock" 
                    className="mr-2" 
                  />
                  <label htmlFor="inStock" className="text-sm">In Stock</label>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 col-span-1 sm:col-span-2">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <input 
                      type="checkbox" 
                      checked={newProduct.isSignatureProduct} 
                      onChange={(e) => setNewProduct({ ...newProduct, isSignatureProduct: e.target.checked })} 
                      id="isSignatureProduct" 
                      className="mr-2" 
                    />
                    <label htmlFor="isSignatureProduct" className="text-sm">Signature Collection</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={newProduct.isSeasonalSpecial} 
                      onChange={(e) => setNewProduct({ ...newProduct, isSeasonalSpecial: e.target.checked })} 
                      id="isSeasonalSpecial" 
                      className="mr-2" 
                    />
                    <label htmlFor="isSeasonalSpecial" className="text-sm">Seasonal Special</label>
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium mt-2" 
                    disabled={isUploading}
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </Modal>
            
            <Modal 
              isOpen={showEditProductModal} 
              onClose={() => { 
                setShowEditProductModal(false); 
                setEditingProduct(null); 
                setFormError(''); 
              }} 
              title="Edit Product"
            >
              {formError && <div className="text-red-600 mb-2 text-sm">{formError}</div>}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editingProduct || !editingProduct.name || !editingProduct.description || !editingProduct.price || !editingProduct.inventory || (!editingProduct.image && !editingProduct.imageFile)) {
                    setFormError('All fields are required.');
                    return;
                  }
                  if (isNaN(Number(editingProduct.price)) || isNaN(Number(editingProduct.inventory))) {
                    setFormError('Price and inventory must be numbers.');
                    return;
                  }
                  let imagePath = editingProduct.image;
                  if (editingProduct.imageFile) {
                    imagePath = await handleImageUpload(editingProduct.imageFile);
                  }
                  await editProduct(editingProduct.id, {
                    ...editingProduct,
                    price: Number(editingProduct.price),
                    inventory: Number(editingProduct.inventory),
                  });
                  setShowEditProductModal(false);
                  setEditingProduct(null);
                  setFormError('');
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={editingProduct?.name || ''} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, name: e.target.value });
                      }
                    }} 
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2" 
                    value={editingProduct?.description || ''} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ ...editingProduct, description: e.target.value });
                      }
                    }} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price (UGX)</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-3 py-2" 
                    value={editingProduct?.price || 0} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          price: Number(e.target.value) 
                        });
                      }
                    }} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select 
                    className="w-full border rounded px-3 py-2" 
                    value={editingProduct?.category_id || ''} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          category_id: e.target.value 
                        });
                      }
                    }}
                  >
                    <option value="" disabled>Select category</option>
                    {state.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="w-full" 
                    onChange={(e) => {
                      if (editingProduct && e.target.files && e.target.files[0]) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          imageFile: e.target.files[0], 
                          image: '' 
                        });
                      }
                    }} 
                  />
                  <input 
                    type="text" 
                    placeholder="or paste image URL" 
                    className="w-full border rounded px-3 py-2 mt-2" 
                    value={editingProduct?.image || ''} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          image: e.target.value, 
                          imageFile: null 
                        });
                      }
                    }} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Inventory</label>
                  <input 
                    type="number" 
                    className="w-full border rounded px-3 py-2" 
                    value={editingProduct?.inventory || 0} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          inventory: Number(e.target.value) 
                        });
                      }
                    }} 
                  />
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={editingProduct?.inStock || false} 
                    onChange={(e) => {
                      if (editingProduct) {
                        setEditingProduct({ 
                          ...editingProduct, 
                          inStock: e.target.checked 
                        });
                      }
                    }} 
                    id="editInStock" 
                    className="mr-2" 
                  />
                  <label htmlFor="editInStock" className="text-sm">In Stock</label>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 col-span-1 sm:col-span-2">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <input 
                      type="checkbox" 
                      checked={editingProduct?.isSignatureProduct || false} 
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ 
                            ...editingProduct, 
                            isSignatureProduct: e.target.checked 
                          });
                        }
                      }} 
                      id="editIsSignatureProduct" 
                      className="mr-2" 
                    />
                    <label htmlFor="editIsSignatureProduct" className="text-sm">Signature Collection</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editingProduct?.isSeasonalSpecial || false} 
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ 
                            ...editingProduct, 
                            isSeasonalSpecial: e.target.checked 
                          });
                        }
                      }} 
                      id="editIsSeasonalSpecial" 
                      className="mr-2" 
                    />
                    <label htmlFor="editIsSeasonalSpecial" className="text-sm">Seasonal Special</label>
                  </div>
                </div>
                
                <div className="col-span-1 sm:col-span-2">
                  <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium mt-2">
                    Save Changes
                  </button>
                </div>
              </form>
            </Modal>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.products.map(product => (
                      <tr key={product.id}>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {product.image ? (
                            <img
                              src={product.image.startsWith('http') ? product.image : product.image}
                              alt={product.name}
                              className="h-12 w-12 object-cover rounded"
                              onError={(e) => { 
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=No+Image'; 
                              }}
                            />
                          ) : (
                            <img 
                              src="https://via.placeholder.com/48x48?text=No+Image" 
                              alt="No image" 
                              className="h-12 w-12 object-cover rounded" 
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{product.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap capitalize">
                          {state.categories.find((cat: Category) => cat.id === product.category_id)?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">{formatUGX(product.price)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{product.inventory}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{product.inStock ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-2 whitespace-nowrap space-x-2">
                          <button
                            className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full p-1"
                            onClick={() => {
                              setEditingProduct({ ...product, imageFile: null });
                              setShowEditProductModal(true);
                            }}
                            aria-label="Edit Product"
                            tabIndex={0}
                            title="Edit Product"
                          >
                            <Edit3 className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-1 ml-1"
                            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                              e.preventDefault();
                              if (window.confirm('Are you sure you want to delete this product?')) {
                                try {
                                  await removeProduct(product.id);
                                } catch (error) {
                                  console.error('Failed to delete product:', error);
                                }
                              }
                            }}
                            aria-label="Delete Product"
                            tabIndex={0}
                            title="Delete Product"
                          >
                            <Trash2 className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <CategoryManager
            categories={state.categories}
            onAdd={createCategory}
            onEdit={editCategory}
            onDelete={removeCategory}
          />
        );

      case 'orders':
        return <OrderManagement />;

      case 'customers':
        return <CustomerManagementDashboard />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 bg-white shadow-xl z-30 border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-amber-600">
            <h1 className="text-xl font-bold text-white">🥐 Bakery Admin</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-amber-50 text-amber-700 shadow-sm border-l-4 border-amber-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-label={item.name}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  activeTab === item.id ? 'bg-amber-100' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : 'text-gray-600'}`} />
                </div>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4 space-y-2">
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg mr-3 bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="p-2 rounded-lg mr-3 bg-red-100">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={`mobile-menu fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-amber-600">
            <h1 className="text-xl font-bold text-white">🥐 Admin</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                aria-label={item.name}
              >
                <div className={`p-2 rounded-lg mr-3 ${
                  activeTab === item.id ? 'bg-amber-100' : 'bg-gray-100'
                }`}>
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : 'text-gray-600'}`} />
                </div>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4 space-y-2">
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg mr-3 bg-gray-100">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <div className="p-2 rounded-lg mr-3 bg-red-100">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 md:ml-72">
          {/* Mobile Header */}
          <header className="md:hidden bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="menu-toggle p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Exit admin mode"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}