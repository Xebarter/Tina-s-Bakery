import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Product } from '../../types';
import { formatUGX } from '../../utils/currency';

// Extend the Product type to ensure image is properly typed
interface ProductWithImage extends Omit<Product, 'image'> {
  image?: string;
  image_url?: string;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<ProductWithImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Modal and product states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithImage | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('Fetched products:', data);

      // Transform the data to match our Product type
      const transformedProducts = data.map(product => ({
        ...product,
        // Ensure all required fields have fallbacks
        inStock: product.inStock ?? true,
        inventory: product.inventory ?? 0,
        // Map category_id to categoryId if needed
        categoryId: product.category_id || product.categoryId
      }));

      setProducts(transformedProducts as ProductWithImage[]);
      // Fetch categories if needed (example)
      const { data: catData } = await supabase.from('categories').select('id, name');
      if (catData) setCategories(catData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for modal and CRUD
  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product: ProductWithImage) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setIsLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      setError('Failed to delete product');
    } else {
      setProducts(products.filter(p => p.id !== productId));
    }
    setIsLoading(false);
  };

  const handleFormSubmit = async (productData: Partial<ProductWithImage>) => {
    setIsLoading(true);
    if (editingProduct) {
      // Update product
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
      if (error) setError('Failed to update product');
    } else {
      // Create product
      const { error } = await supabase.from('products').insert([productData]);
      if (error) setError('Failed to create product');
    }
    setShowModal(false);
    setEditingProduct(null);
    await fetchProducts();
    setIsLoading(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Products</h2>
        <button onClick={handleNewProduct} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          New Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Image</th>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Price</th>
              <th scope="col" className="px-6 py-3">Category</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-2">
                  {prod.image || prod.image_url ? (
                    <img
                      src={prod.image || prod.image_url}
                      alt={prod.name}
                      className="w-12 h-12 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                      <span>No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                <td className="px-6 py-4">{formatUGX(prod.price)}</td>
                <td className="px-6 py-4">{prod.categoryId}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-blue-600 hover:text-blue-800" onClick={() => handleEditProduct(prod)}>
                    <Edit size={18} />
                  </button>
                  <button className="p-2 text-red-600 hover:text-red-800" onClick={() => handleDeleteProduct(prod.id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for ProductForm */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
            {/* ProductForm expects product, categories, onSubmit, onCancel, isEditing */}
            <ProductForm
              product={editingProduct ?? undefined}
              categories={categories}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isEditing={!!editingProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { ProductManagement };
