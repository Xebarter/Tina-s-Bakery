export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breads' | 'pastries' | 'cakes' | 'cookies' | 'seasonal';
  image: string;
  inStock: boolean;
  inventory: number;
  featured: boolean;
  ingredients?: string[];
  allergens?: string[];
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  portion_size?: string;
  preparation_time?: number;
  difficulty_level?: 'Easy' | 'Medium' | 'Hard';
  special_pricing?: {
    promotional_price?: number;
    bulk_price?: number;
    bulk_quantity?: number;
  };
  display_settings?: {
    visible: boolean;
    display_order: number;
    badges?: string[];
  };
  isSeasonalSpecial: boolean;
  seasonal_dates?: {
    start_date: string;
    end_date: string;
  };
  isSignatureProduct: boolean;
  signature_description?: string;
  created_at: string;
  updated_at: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Artisan Sourdough Bread',
    description: 'Traditional sourdough bread with a crispy crust and tangy flavor, made with our 100-year-old starter.',
    price: 450,
    category: 'breads',
    image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg',
    inStock: true,
    inventory: 25,
    featured: true,
    ingredients: ['Flour', 'Water', 'Sourdough starter', 'Salt'],
    allergens: ['Gluten'],
    nutritional_info: {
      calories: 250,
      protein: 8,
      carbs: 48,
      fat: 2,
      fiber: 3,
      sugar: 1
    },
    portion_size: '1 loaf (500g)',
    preparation_time: 24,
    difficulty_level: 'Hard',
    display_settings: {
      visible: true,
      display_order: 1,
      badges: ['Artisan', 'Traditional']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: true,
    signature_description: 'Our most beloved bread, crafted using traditional methods passed down through generations.',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    name: 'Chocolate Croissant',
    description: 'Buttery, flaky croissant filled with rich Belgian chocolate.',
    price: 180,
    category: 'pastries',
    image: 'https://images.pexels.com/photos/2135677/pexels-photo-2135677.jpeg',
    inStock: true,
    inventory: 40,
    featured: true,
    ingredients: ['Flour', 'Butter', 'Yeast', 'Belgian chocolate', 'Eggs', 'Milk'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 320,
      protein: 6,
      carbs: 35,
      fat: 18,
      fiber: 2,
      sugar: 12
    },
    portion_size: '1 piece (80g)',
    preparation_time: 3,
    difficulty_level: 'Medium',
    special_pricing: {
      bulk_price: 150,
      bulk_quantity: 6
    },
    display_settings: {
      visible: true,
      display_order: 2,
      badges: ['Popular', 'Belgian Chocolate']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: true,
    signature_description: 'Made with authentic Belgian chocolate and French pastry techniques.',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    name: 'Red Velvet Cake',
    description: 'Moist red velvet cake with cream cheese frosting and a hint of cocoa.',
    price: 2500,
    category: 'cakes',
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
    inStock: true,
    inventory: 8,
    featured: true,
    ingredients: ['Flour', 'Cocoa powder', 'Red food coloring', 'Buttermilk', 'Cream cheese', 'Butter', 'Sugar', 'Eggs'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 450,
      protein: 5,
      carbs: 65,
      fat: 20,
      fiber: 2,
      sugar: 55
    },
    portion_size: '1 slice (120g)',
    preparation_time: 4,
    difficulty_level: 'Medium',
    display_settings: {
      visible: true,
      display_order: 3,
      badges: ['Classic', 'Cream Cheese Frosting']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: true,
    signature_description: 'Our signature red velvet recipe with the perfect balance of cocoa and vanilla.',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '4',
    name: 'Chocolate Chip Cookies',
    description: 'Classic chocolate chip cookies with a perfect chewy texture.',
    price: 80,
    category: 'cookies',
    image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
    inStock: true,
    inventory: 60,
    featured: false,
    ingredients: ['Flour', 'Butter', 'Brown sugar', 'White sugar', 'Chocolate chips', 'Eggs', 'Vanilla'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 180,
      protein: 3,
      carbs: 25,
      fat: 8,
      fiber: 1,
      sugar: 15
    },
    portion_size: '1 cookie (30g)',
    preparation_time: 1,
    difficulty_level: 'Easy',
    special_pricing: {
      bulk_price: 70,
      bulk_quantity: 12
    },
    display_settings: {
      visible: true,
      display_order: 4,
      badges: ['Classic', 'Kids Favorite']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '5',
    name: 'Pumpkin Spice Latte Cake',
    description: 'Seasonal pumpkin spice cake with cinnamon cream cheese frosting.',
    price: 2800,
    category: 'seasonal',
    image: 'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg',
    inStock: true,
    inventory: 5,
    featured: true,
    ingredients: ['Pumpkin puree', 'Flour', 'Cinnamon', 'Nutmeg', 'Cloves', 'Cream cheese', 'Butter', 'Sugar', 'Eggs'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 380,
      protein: 4,
      carbs: 58,
      fat: 16,
      fiber: 3,
      sugar: 45
    },
    portion_size: '1 slice (130g)',
    preparation_time: 5,
    difficulty_level: 'Medium',
    display_settings: {
      visible: true,
      display_order: 1,
      badges: ['Seasonal', 'Limited Time', 'Spiced']
    },
    isSeasonalSpecial: true,
    seasonal_dates: {
      start_date: '2024-09-01',
      end_date: '2024-11-30'
    },
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '6',
    name: 'Whole Wheat Bread',
    description: 'Healthy whole wheat bread packed with fiber and nutrients.',
    price: 380,
    category: 'breads',
    image: 'https://images.pexels.com/photos/1586947/pexels-photo-1586947.jpeg',
    inStock: true,
    inventory: 20,
    featured: false,
    ingredients: ['Whole wheat flour', 'Water', 'Yeast', 'Honey', 'Salt', 'Olive oil'],
    allergens: ['Gluten'],
    nutritional_info: {
      calories: 220,
      protein: 9,
      carbs: 42,
      fat: 3,
      fiber: 6,
      sugar: 3
    },
    portion_size: '1 loaf (450g)',
    preparation_time: 4,
    difficulty_level: 'Easy',
    display_settings: {
      visible: true,
      display_order: 5,
      badges: ['Healthy', 'High Fiber']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '7',
    name: 'Almond Croissant',
    description: 'Flaky croissant filled with sweet almond paste and topped with sliced almonds.',
    price: 200,
    category: 'pastries',
    image: 'https://images.pexels.com/photos/2135677/pexels-photo-2135677.jpeg',
    inStock: true,
    inventory: 30,
    featured: false,
    ingredients: ['Flour', 'Butter', 'Almond paste', 'Sliced almonds', 'Sugar', 'Eggs'],
    allergens: ['Gluten', 'Dairy', 'Eggs', 'Nuts'],
    nutritional_info: {
      calories: 340,
      protein: 8,
      carbs: 32,
      fat: 20,
      fiber: 3,
      sugar: 14
    },
    portion_size: '1 piece (85g)',
    preparation_time: 3,
    difficulty_level: 'Medium',
    display_settings: {
      visible: true,
      display_order: 6,
      badges: ['Almond', 'French Style']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '8',
    name: 'Vanilla Birthday Cake',
    description: 'Classic vanilla sponge cake with buttercream frosting, perfect for celebrations.',
    price: 2200,
    category: 'cakes',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
    inStock: true,
    inventory: 10,
    featured: false,
    ingredients: ['Flour', 'Sugar', 'Butter', 'Eggs', 'Vanilla extract', 'Baking powder', 'Milk'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 420,
      protein: 4,
      carbs: 62,
      fat: 18,
      fiber: 1,
      sugar: 52
    },
    portion_size: '1 slice (110g)',
    preparation_time: 3,
    difficulty_level: 'Easy',
    display_settings: {
      visible: true,
      display_order: 7,
      badges: ['Birthday', 'Classic', 'Customizable']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '9',
    name: 'Oatmeal Raisin Cookies',
    description: 'Chewy oatmeal cookies with plump raisins and a hint of cinnamon.',
    price: 90,
    category: 'cookies',
    image: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
    inStock: true,
    inventory: 45,
    featured: false,
    ingredients: ['Oats', 'Flour', 'Raisins', 'Brown sugar', 'Butter', 'Cinnamon', 'Eggs'],
    allergens: ['Gluten', 'Dairy', 'Eggs'],
    nutritional_info: {
      calories: 160,
      protein: 3,
      carbs: 28,
      fat: 6,
      fiber: 2,
      sugar: 18
    },
    portion_size: '1 cookie (35g)',
    preparation_time: 1,
    difficulty_level: 'Easy',
    display_settings: {
      visible: true,
      display_order: 8,
      badges: ['Healthy', 'Fiber Rich']
    },
    isSeasonalSpecial: false,
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '10',
    name: 'Christmas Fruit Cake',
    description: 'Traditional Christmas fruit cake with dried fruits, nuts, and a touch of brandy.',
    price: 3200,
    category: 'seasonal',
    image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
    inStock: true,
    inventory: 3,
    featured: true,
    ingredients: ['Mixed dried fruits', 'Nuts', 'Flour', 'Butter', 'Brown sugar', 'Eggs', 'Brandy', 'Spices'],
    allergens: ['Gluten', 'Dairy', 'Eggs', 'Nuts'],
    nutritional_info: {
      calories: 520,
      protein: 6,
      carbs: 75,
      fat: 22,
      fiber: 4,
      sugar: 65
    },
    portion_size: '1 slice (150g)',
    preparation_time: 8,
    difficulty_level: 'Hard',
    display_settings: {
      visible: true,
      display_order: 2,
      badges: ['Christmas', 'Traditional', 'Premium']
    },
    isSeasonalSpecial: true,
    seasonal_dates: {
      start_date: '2024-11-15',
      end_date: '2024-12-31'
    },
    isSignatureProduct: false,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];

export default products;