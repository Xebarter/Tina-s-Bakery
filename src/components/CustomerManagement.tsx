import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Calendar,
  User,
  Building,
  Eye,
  DollarSign
} from 'lucide-react';
import { customerService, CustomerWithOrders } from '../services/customerService';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';
import { formatUGX } from '../utils/currency';

interface CustomerManagementProps {
  orders: any[];
}

export function CustomerManagement({ orders }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithOrders[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-orders' | 'without-orders' | 'direct' | 'order-source'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'orders' | 'spent'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [orders]);

  const loadCustomers = async () => {
    try {
      const customersWithOrders = await customerService.getCustomersWithOrders(orders);
      setCustomers(customersWithOrders);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  // Filter and sort customers
  useEffect(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = (() => {
        switch (filterType) {
          case 'with-orders':
            return customer.totalOrders > 0;
          case 'without-orders':
            return customer.totalOrders === 0;
          case 'direct':
            return customer.registrationSource === 'direct';
          case 'order-source':
            return customer.registrationSource === 'order';
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesFilter;
    });

    // Sort customers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'spent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterType, sortBy, sortOrder]);

  const handleRegistrationSuccess = (customer: any) => {
    loadCustomers();
    setShowRegistrationModal(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerService.deleteCustomer(customerId);
        loadCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const getRegistrationSourceBadge = (source: string) => {
    return source === 'direct' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800';
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600 mt-1">
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
        <button
          onClick={() => setShowRegistrationModal(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-md font-medium hover:bg-amber-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register Customer
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Customers</option>
            <option value="with-orders">With Orders</option>
            <option value="without-orders">Without Orders</option>
            <option value="direct">Direct Registration</option>
            <option value="order-source">Order Registration</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="orders-desc">Most Orders</option>
            <option value="orders-asc">Least Orders</option>
            <option value="spent-desc">Highest Spent</option>
            <option value="spent-asc">Lowest Spent</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            {filteredCustomers.length} results
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-amber-100 rounded-full p-2 mr-3">
                        <User className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        <div className="text-sm text-gray-500">ID: {customer.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-3 w-3 mr-2 text-gray-400" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                        {customer.address}, {customer.city}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRegistrationSourceBadge(customer.registrationSource)}`}>
                        {customer.registrationSource === 'direct' ? 'Direct' : 'Order Form'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatUGX(customer.totalSpent * 130)} total
                      </div>
                      {customer.lastOrderDate && (
                        <div className="text-xs text-gray-500">
                          Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetails(true);
                        }}
                        className="text-amber-600 hover:text-amber-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Registration Modal */}
      <CustomerRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Details - {selectedCustomer.fullName}
              </h3>
              <button
                onClick={() => setShowCustomerDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedCustomer.fullName}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedCustomer.phone}
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {selectedCustomer.email}
                      </div>
                    )}
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedCustomer.address}
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      {selectedCustomer.city}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Registration Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>Registration Source: 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRegistrationSourceBadge(selectedCustomer.registrationSource)}`}>
                        {selectedCustomer.registrationSource === 'direct' ? 'Direct Registration' : 'Order Form'}
                      </span>
                    </div>
                    <div>Registered: {new Date(selectedCustomer.createdAt).toLocaleString()}</div>
                    <div>Last Updated: {new Date(selectedCustomer.updatedAt).toLocaleString()}</div>
                    <div>Total Orders: <span className="font-medium">{selectedCustomer.totalOrders}</span></div>
                    <div>Total Spent: <span className="font-medium">{formatUGX(selectedCustomer.totalSpent * 130)}</span></div>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order History</h4>
                {selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <p className="font-semibold mt-1">{formatUGX(order.total * 130)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          {order.items && order.items.length > 0 && (
                            <span className="ml-2">
                              ({order.items.slice(0, 2).map((item: any) => item.name).join(', ')}
                              {order.items.length > 2 && '...'})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}