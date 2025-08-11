import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  DollarSign, 
  Package, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { customerAuthService, Customer } from '../services/customerAuthService';
import { formatUGX } from '../utils/currency';
import { useApp } from '../contexts/AppContext';

export function CustomerManagementDashboard() {
  const { state, editCustomer, removeCustomer } = useApp();
  const [filteredCustomers, setFilteredCustomers] = useState(state.customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'billing_only' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'orders' | 'spent' | 'location'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    registeredCustomers: 0,
    billingOnlyCustomers: 0,
    activeCustomers: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    setFilteredCustomers(state.customers);
    loadStats();
  }, [state.customers]);

  const loadStats = async () => {
    try {
      const statsData = await customerAuthService.getCustomerStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Filter and sort customers
  useEffect(() => {
    let filtered = state.customers.filter(customer => {
      const matchesSearch = 
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = (() => {
        switch (filterType) {
          case 'registered':
            return customer.accountType === 'registered';
          case 'billing_only':
            return customer.accountType === 'billing_only';
          case 'active':
            return customer.isActive;
          case 'inactive':
            return !customer.isActive;
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
        case 'location':
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
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
  }, [state.customers, searchTerm, filterType, sortBy, sortOrder]);

  const exportCustomerData = () => {
    const csvData = filteredCustomers.map(customer => ({
      'Full Name': customer.fullName,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Address': customer.address,
      'City': customer.city,
      'Country': customer.country,
      'Account Type': customer.accountType,
      'Status': customer.isActive ? 'Active' : 'Inactive',
      'Total Orders': customer.totalOrders,
      'Total Spent': customer.totalSpent,
      'Registration Date': new Date(customer.createdAt).toLocaleDateString(),
      'Last Order': customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAccountTypeBadge = (accountType: string) => {
    return accountType === 'registered' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600 mt-1">
            {filteredCustomers.length} of {state.customers.length} customers
          </p>
        </div>
        <button
          onClick={exportCustomerData}
          disabled={filteredCustomers.length === 0}
          className="bg-amber-600 text-white px-4 py-2 rounded-md font-medium hover:bg-amber-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Registered</p>
              <p className="text-2xl font-bold text-green-900">{stats.registeredCustomers}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Billing Only</p>
              <p className="text-2xl font-bold text-purple-900">{stats.billingOnlyCustomers}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Active</p>
              <p className="text-2xl font-bold text-amber-900">{stats.activeCustomers}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-900">{formatUGX(stats.totalRevenue * 130)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
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
            <option value="registered">Registered Accounts</option>
            <option value="billing_only">Billing Only</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            <option value="spent-desc">Highest Spent</option>
            <option value="spent-asc">Lowest Spent</option>
            <option value="orders-desc">Most Orders</option>
            <option value="orders-asc">Least Orders</option>
            <option value="location-asc">Location A-Z</option>
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
                  Account Info
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
                        <Users className="h-5 w-5 text-amber-600" />
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
                        {customer.city}, {customer.country}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeBadge(customer.accountType)}`}>
                        {customer.accountType === 'registered' ? 'Registered' : 'Billing Only'}
                      </span>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(customer.isActive)}`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
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
                      {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Account Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>Account Type: 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeBadge(selectedCustomer.accountType)}`}>
                        {selectedCustomer.accountType === 'registered' ? 'Registered Account' : 'Billing Only'}
                      </span>
                    </div>
                    <div>Status: 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedCustomer.isActive)}`}>
                        {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>Registered: {new Date(selectedCustomer.createdAt).toLocaleString()}</div>
                    <div>Last Updated: {new Date(selectedCustomer.updatedAt).toLocaleString()}</div>
                    <div>Total Orders: <span className="font-medium">{selectedCustomer.totalOrders}</span></div>
                    <div>Total Spent: <span className="font-medium">{formatUGX(selectedCustomer.totalSpent * 130)}</span></div>
                    {selectedCustomer.lastOrderDate && (
                      <div>Last Order: {new Date(selectedCustomer.lastOrderDate).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}