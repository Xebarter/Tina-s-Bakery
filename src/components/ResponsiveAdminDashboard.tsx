import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  BarChart3,
  Package,
  Users,
  ShoppingBag,
  Trash2,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Clock,
  Filter,
  Edit
} from 'lucide-react';
import { AppContext, AppContextType } from '../contexts/AppContext';
import { Product, Category, Order } from '../types';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
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
  onAdd: (cat: { name: string; description?: string }) => void;
  onEdit: (id: string, updates: { name: string; description?: string }) => void;
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <button
          onClick={() => {
            setShowAdd(!showAdd);
            setAddError('');
            if (showAdd) {
              setNewName('');
              setNewDesc('');
            }
          }}
          className="bg-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center gap-2"
        >
          {showAdd ? (
            <>
              <X className="h-5 w-5" /> Cancel
            </>
          ) : (
            <>
              <Filter className="h-5 w-5" /> Add Category
            </>
          )}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => {
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
            onAdd({ name, description: newDesc.trim() });
            setNewName('');
            setNewDesc('');
            setShowAdd(false);
          }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter category name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Enter category description"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex-1"
            >
              Save Category
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewName('');
                setNewDesc('');
                setAddError('');
              }}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex-1"
            >
              Cancel
            </button>
          </div>
          {addError && <div className="text-red-600 text-sm mt-2 bg-red-50 p-3 rounded-lg">{addError}</div>}
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Filter className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No categories found</p>
                      <p className="text-sm">Get started by adding your first category</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat: Category) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editId === cat.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      ) : (
                        <span className="text-gray-900 font-medium">{cat.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editId === cat.id ? (
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      ) : (
                        <span className="text-gray-600">{cat.description || 'No description'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editId === cat.id ? (
                        <div className="flex gap-2">
                          {editError && <div className="text-red-600 text-xs mb-1 bg-red-50 p-2 rounded">{editError}</div>}
                          <button
                            onClick={async () => {
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
                              await onEdit(cat.id, { name, description: editDesc.trim() });
                              setEditId(null);
                            }}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditId(cat.id);
                              setEditName(cat.name);
                              setEditDesc(cat.description || '');
                              setEditError('');
                            }}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this category?')) {
                                onDelete(cat.id);
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    { id: 'products', name: 'Products', icon: Package, color: 'text-green-600' },
    { id: 'categories', name: 'Categories', icon: Filter, color: 'text-orange-600' },
    { id: 'orders', name: 'Orders', icon: ShoppingBag, color: 'text-purple-600' },
    { id: 'customers', name: 'Customers', icon: Users, color: 'text-pink-600' },
  ];

  const handleTabChange = (tabId: string) => {
    setIsLoading(true);
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setTimeout(() => setIsLoading(false), 300);
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to exit admin mode?')) {
      // Clear authentication state
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('admin_info');
      // Trigger storage event to update other tabs
      window.dispatchEvent(new Event('storage'));
      // Redirect to login page
      navigate('/admin/login');
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

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
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
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-200"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-3xl font-bold mb-2">Welcome back, Tina</h2>
                  <p className="text-amber-100">Here's what's happening with your bakery today</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-amber-100">Today</p>
                  <p className="text-2xl font-semibold">{new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
                  <p className="text-3xl font-bold text-gray-900">{formatUGX(totalSales)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Customers</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Clock className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="text-right">
                    {pendingOrders > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Urgent
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                      >
                        View All <span className="hidden sm:inline">Orders</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No orders yet</p>
                        <p className="text-sm">Your recent orders will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.map((order, index) => (
                          <div
                            key={order.id}
                            className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => handleTabChange('orders')}
                          >
                            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Order #{order.id.substring(0, 8)}...</p>
                                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-lg">{formatUGX(order.total)}</p>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
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
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    <button
                      onClick={() => handleTabChange('products')}
                      className="w-full flex items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                    >
                      <div className="p-3 bg-green-600 rounded-lg mr-4">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 group-hover:text-green-700">Manage Products</p>
                        <p className="text-sm text-gray-600">Add or edit bakery items</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabChange('orders')}
                      className="w-full flex items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                    >
                      <div className="p-3 bg-purple-600 rounded-lg mr-4">
                        <ShoppingBag className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 group-hover:text-purple-700">Process Orders</p>
                        <p className="text-sm text-gray-600">Manage order queue</p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTabChange('categories')}
                      className="w-full flex items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors group"
                    >
                      <div className="p-3 bg-orange-600 rounded-lg mr-4">
                        <Filter className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 group-hover:text-orange-700">Manage Categories</p>
                        <p className="text-sm text-gray-600">Organize your products</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-semibold text-gray-900">Performance</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                        <span className="text-sm font-bold text-gray-900">
                          {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{completedOrders} completed</span>
                        <span className="text-xs text-gray-500">{totalOrders - completedOrders} pending</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Active Orders</span>
                        <span className="text-sm font-bold text-gray-900">{pendingOrders}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-amber-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">{pendingOrders} pending</span>
                        <span className="text-xs text-gray-500">{totalOrders - pendingOrders} processed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <p className="text-gray-600 mt-1">Manage your bakery's product catalog</p>
              </div>
              <button
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex items-center gap-2 min-w-fit"
                onClick={() => setShowAddProductModal(true)}
              >
                <Package className="h-5 w-5" /> Add New Product
              </button>
            </div>

            {showAddSuccess && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-fade-in-down">
                <div className="bg-green-500 text-white text-center py-4 rounded-xl shadow-lg font-semibold text-lg flex items-center justify-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Product added successfully
                </div>
              </div>
            )}

            <Modal
              isOpen={showAddProductModal}
              onClose={() => {
                setShowAddProductModal(false);
                setFormError('');
                setUploadStatus('idle');
              }}
              title="Add New Product"
            >
              {formError && <div className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded-lg">{formError}</div>}

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20 rounded-xl">
                  <div className="flex flex-col items-center">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle
                        cx="40" cy="40" r="36"
                        fill="none" stroke="#e5e7eb" strokeWidth="8"
                      />
                      <circle
                        cx="40" cy="40" r="36"
                        fill="none"
                        stroke={uploadStatus === 'error' ? '#dc2626' : '#22c55e'}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 36}
                        strokeDashoffset={
                          uploadStatus === 'uploading'
                            ? 2 * Math.PI * 36 * 0.75
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
                          points="28,42 38,52 56,32"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {uploadStatus === 'error' && (
                        <line x1="28" y1="28" x2="52" y2="52" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
                      )}
                    </svg>
                    <div className="mt-6 text-xl font-semibold text-gray-700">
                      {uploadStatus === 'uploading' && 'Uploading...'}
                      {uploadStatus === 'success' && 'Product added successfully!'}
                      {uploadStatus === 'error' && 'Upload failed'}
                    </div>
                    {uploadStatus === 'uploading' && (
                      <div className="mt-2 text-sm text-gray-500">Please wait while we process your request</div>
                    )}
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
                      setFormError('All required fields must be filled.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }

                    if (isNaN(Number(newProduct.price)) || isNaN(Number(newProduct.inventory))) {
                      setFormError('Price and inventory must be valid numbers.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }

                    if (Number(newProduct.price) <= 0) {
                      setFormError('Price must be greater than zero.');
                      setIsUploading(false);
                      setUploadStatus('idle');
                      return;
                    }

                    if (Number(newProduct.inventory) < 0) {
                      setFormError('Inventory cannot be negative.');
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
                      setFormError('Please select a category.');
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
                      // createdAt and updatedAt removed
                      // slug removed
                      // sold removed
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
                        }, 1500);
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
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                style={isUploading ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your product"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (UGX) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    value={newProduct.category_id || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  >
                    <option value="" disabled>Select category</option>
                    {state.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="product-image-upload"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files[0]) setNewProduct({ ...newProduct, imageFile: files[0], image: '' });
                        }}
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4 4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="mt-2 block text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </span>
                      </label>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value, imageFile: null })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inventory *</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    value={newProduct.inventory}
                    onChange={(e) => setNewProduct({ ...newProduct, inventory: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.inStock}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                    id="inStock"
                    className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="inStock" className="ml-3 block text-sm font-medium text-gray-700">
                    In Stock
                  </label>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Product Features</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newProduct.isSignatureProduct}
                          onChange={(e) => setNewProduct({ ...newProduct, isSignatureProduct: e.target.checked })}
                          id="isSignatureProduct"
                          className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="isSignatureProduct" className="ml-3 block text-sm font-medium text-gray-700">
                          Signature Collection
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newProduct.isSeasonalSpecial}
                          onChange={(e) => setNewProduct({ ...newProduct, isSeasonalSpecial: e.target.checked })}
                          id="isSeasonalSpecial"
                          className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="isSeasonalSpecial" className="ml-3 block text-sm font-medium text-gray-700">
                          Seasonal Special
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium text-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Adding Product...' : 'Add Product'}
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
              {formError && <div className="text-red-600 mb-4 text-sm bg-red-50 p-3 rounded-lg">{formError}</div>}

              {editingProduct && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingProduct.name || !editingProduct.description || !editingProduct.price || !editingProduct.inventory || (!editingProduct.image && !editingProduct.imageFile)) {
                      setFormError('All required fields must be filled.');
                      return;
                    }

                    if (isNaN(Number(editingProduct.price)) || isNaN(Number(editingProduct.inventory))) {
                      setFormError('Price and inventory must be valid numbers.');
                      return;
                    }

                    if (Number(editingProduct.price) <= 0) {
                      setFormError('Price must be greater than zero.');
                      return;
                    }

                    if (Number(editingProduct.inventory) < 0) {
                      setFormError('Inventory cannot be negative.');
                      return;
                    }

                    let imagePath = editingProduct.image;
                    if (editingProduct.imageFile) {
                      try {
                        const compressed = await compressImage(editingProduct.imageFile, 0.7);
                        imagePath = await handleImageUpload(compressed);
                      } catch (error) {
                        console.error('Image upload failed:', error);
                        setFormError('Failed to upload image. Please try again.');
                        return;
                      }
                    }

                    const categoryId = editingProduct.category_id ||
                      (state.categories.length > 0 ? state.categories[0].id : '');

                    if (!categoryId) {
                      setFormError('Please select a category.');
                      return;
                    }

                    const updates = {
                      name: editingProduct.name,
                      description: editingProduct.description,
                      price: Number(editingProduct.price),
                      inventory: Number(editingProduct.inventory),
                      category_id: categoryId,
                      image: imagePath,
                      inStock: editingProduct.inStock,
                      isSignatureProduct: editingProduct.isSignatureProduct,
                      isSeasonalSpecial: editingProduct.isSeasonalSpecial,
                    };

                    await editProduct(editingProduct.id, updates);
                    setShowEditProductModal(false);
                    setEditingProduct(null);
                    setFormError('');
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      value={editingProduct?.name || ''}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, name: e.target.value });
                        }
                      }}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      value={editingProduct?.description || ''}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, description: e.target.value });
                        }
                      }}
                      rows={3}
                      placeholder="Describe your product"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (UGX) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      value={editingProduct?.price || 0}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({
                            ...editingProduct,
                            price: Number(e.target.value)
                          });
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image *</label>
                    <div className="space-y-3">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="edit-product-image-upload"
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
                        <label
                          htmlFor="edit-product-image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4 4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="mt-2 block text-sm font-medium text-gray-700">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                          </span>
                        </label>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Or paste image URL"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inventory *</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      value={editingProduct?.inventory || 0}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({
                            ...editingProduct,
                            inventory: Number(e.target.value)
                          });
                        }
                      }}
                      placeholder="0"
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
                      className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="editInStock" className="ml-3 block text-sm font-medium text-gray-700">
                      In Stock
                    </label>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Product Features</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center">
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
                            className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <label htmlFor="editIsSignatureProduct" className="ml-3 block text-sm font-medium text-gray-700">
                            Signature Collection
                          </label>
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
                            className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <label htmlFor="editIsSeasonalSpecial" className="ml-3 block text-sm font-medium text-gray-700">
                            Seasonal Special
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium text-lg transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </Modal>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Products List</h3>
                    <p className="text-gray-600 mt-1">Manage your product catalog</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {state.products.length} {state.products.length === 1 ? 'product' : 'products'}
                  </div>
                </div>
              </div>

              {state.products.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">Get started by adding your first product</p>
                  <button
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                    onClick={() => setShowAddProductModal(true)}
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Inventory</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {state.products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.image ? (
                              <div className="h-16 w-16 rounded-lg overflow-hidden">
                                <img
                                  src={product.image.startsWith('http') ? product.image : product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64?text=No+Image';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-medium">{product.name}</span>
                              {product.isSignatureProduct && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                                  Signature
                                </span>
                              )}
                              {product.isSeasonalSpecial && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 mt-1">
                                  Seasonal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-600 capitalize">
                              {state.categories.find((cat: Category) => cat.id === product.category_id)?.name || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-900 font-medium">{formatUGX(product.price)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-medium ${product.inventory < 10 ? 'text-red-600' :
                              product.inventory < 20 ? 'text-amber-600' : 'text-green-600'
                              }`}>
                              {product.inventory}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full p-2 hover:bg-blue-50 transition-colors"
                                onClick={() => {
                                  setEditingProduct({ ...product, imageFile: null });
                                  setShowEditProductModal(true);
                                }}
                                aria-label="Edit Product"
                                title="Edit Product"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                className="inline-flex items-center justify-center text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-2 hover:bg-red-50 transition-colors"
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
                                title="Delete Product"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 bg-white shadow-xl z-30 border-r border-gray-200">
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-amber-600">
            <h1 className="text-xl font-bold text-white">🧁 Bakery Admin</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 group ${activeTab === item.id
                  ? 'bg-amber-50 text-amber-700 shadow-sm border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                aria-label={item.name}
              >
                <div className={`p-2 rounded-lg mr-3 ${activeTab === item.id
                  ? 'bg-amber-100'
                  : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : 'text-gray-600'}`} />
                </div>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4 space-y-1">
            <button className="w-full flex items-center px-4 py-3 text-left rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group">
              <div className="p-2 rounded-lg mr-3 bg-gray-100 group-hover:bg-gray-200">
                <Settings className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-medium">Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
            >
              <div className="p-2 rounded-lg mr-3 bg-red-100 group-hover:bg-red-200">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-medium">Exit Admin</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside className={`mobile-menu fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-amber-600">
            <h1 className="text-xl font-bold text-white">🧁 Admin</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${activeTab === item.id
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
                aria-label={item.name}
              >
                <div className={`p-2 rounded-lg mr-3 ${activeTab === item.id ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? item.color : 'text-gray-600'}`} />
                </div>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-gray-200 p-4 space-y-1">
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
        <div className="flex-1 md:ml-72 transition-all duration-300">
          {/* Mobile Header */}
          <header className="md:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="menu-toggle p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center">
                {menuItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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

      {/* Global styles for animations */}
      <style>{`
        @keyframes spin-circular {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out;
        }
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px) translateX(-50%);
          }
          100% {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}