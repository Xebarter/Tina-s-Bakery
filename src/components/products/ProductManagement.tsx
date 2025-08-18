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
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xl max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Products</h2>
        <button onClick={handleNewProduct} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150">
          <Plus className="w-5 h-5" />
          <span className="font-semibold">New Product</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Image</th>
                <th scope="col" className="px-6 py-3 font-semibold">Name</th>
                <th scope="col" className="px-6 py-3 font-semibold">Price</th>
                <th scope="col" className="px-6 py-3 font-semibold">Category</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No products found.</td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="bg-white border-b hover:bg-blue-50 transition-all">
                    <td className="px-6 py-2">
                      {(prod.image || prod.image_url) ? (
                        <img
                          src={prod.image || prod.image_url}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-md border border-gray-200 shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border border-gray-200">
                          <span>No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{prod.name}</td>
                    <td className="px-6 py-4">{formatUGX(prod.price)}</td>
                    <td className="px-6 py-4 capitalize">{prod.categoryId}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button className="p-2 rounded hover:bg-blue-100 text-blue-600 transition-all" title="Edit" onClick={() => handleEditProduct(prod)}>
                        <Edit size={18} />
                      </button>
                      <button className="p-2 rounded hover:bg-red-100 text-red-600 transition-all" title="Delete" onClick={() => handleDeleteProduct(prod.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for ProductForm */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-xl border border-gray-200 animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-gray-900">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
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
