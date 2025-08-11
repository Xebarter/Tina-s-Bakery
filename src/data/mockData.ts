import { Customer, Order, CakeOrder, SalesReport } from '../types';

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    email: 'sarah.johnson@email.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    phone: '(555) 123-4567',
    loyaltyPoints: 250,
    orders: [],
    joinDate: '2023-06-15'
  },
  {
    id: 'cust-002',
    email: 'mike.davis@email.com',
    firstName: 'Mike',
    lastName: 'Davis',
    phone: '(555) 987-6543',
    loyaltyPoints: 180,
    orders: [],
    joinDate: '2023-08-22'
  },
  {
    id: 'cust-003',
    email: 'emily.chen@email.com',
    firstName: 'Emily',
    lastName: 'Chen',
    phone: '(555) 456-7890',
    loyaltyPoints: 420,
    orders: [],
    joinDate: '2023-03-10'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    customerId: 'cust-001',
    items: [
      {
        id: 'bread-001',
        name: 'Artisan Sourdough',
        description: 'Traditional sourdough bread',
        price: 6.50,
        category: 'breads',
        image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg',
        inStock: true,
        inventory: 12,
        quantity: 2
      }
    ],
    total: 13.00,
    status: 'preparing',
    orderDate: '2024-01-15T10:30:00Z',
    pickupDate: '2024-01-16T14:00:00Z',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'order-002',
    customerId: 'cust-002',
    items: [
      {
        id: 'cake-001',
        name: 'Classic Chocolate Layer Cake',
        description: 'Rich chocolate cake',
        price: 45.00,
        category: 'cakes',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
        inStock: true,
        inventory: 3,
        quantity: 1
      }
    ],
    total: 45.00,
    status: 'ready',
    orderDate: '2024-01-14T15:45:00Z',
    pickupDate: '2024-01-15T16:00:00Z',
    paymentMethod: 'Cash'
  }
];

export const mockCakeOrders: CakeOrder[] = [
  {
    id: 'cake-order-001',
    customerId: 'cust-003',
    cakeType: 'Wedding Cake',
    size: '3-tier',
    flavor: 'Vanilla & Chocolate',
    frosting: 'Buttercream',
    decorations: ['Fresh Flowers', 'Pearl Details'],
    customText: 'Sarah & Mike',
    price: 350.00,
    neededBy: '2024-02-14',
    status: 'confirmed',
    notes: 'Delivery required to venue'
  }
];

export const mockSalesReport: SalesReport = {
  date: '2024-01-15',
  totalSales: 1250.75,
  orderCount: 28,
  topProducts: [
    { productId: 'bread-001', quantity: 15, revenue: 97.50 },
    { productId: 'pastry-001', quantity: 22, revenue: 77.00 },
    { productId: 'cake-001', quantity: 3, revenue: 135.00 }
  ],
  customerCount: 24
};