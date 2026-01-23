import { vi } from 'vitest';

// Mock Inventory Auth Context values
export const mockMasterUser = {
  uid: 'master-uid-123',
  email: 'master@store.com',
  emailVerified: true,
  displayName: 'Store Owner',
};

export const mockMemberUser = {
  uid: 'member-uid-456',
  email: 'employee@store.com',
  emailVerified: true,
  displayName: 'John Employee',
};

export const mockMasterProfile = {
  uid: 'master-uid-123',
  email: 'master@store.com',
  displayName: 'Store Owner',
  role: 'master',
  accountType: 'inventory',
  businessName: 'Test Electronics Store',
};

export const mockMemberProfile = {
  uid: 'member-uid-456',
  email: 'employee@store.com',
  displayName: 'John Employee',
  role: 'member',
  accountType: 'inventory',
  ownerUid: 'master-uid-123',
  assignedStoreId: 'store-123',
  assignedStoreName: 'Main Store',
};

export const mockInventoryAuthContextValue = {
  currentUser: mockMasterUser,
  userProfile: mockMasterProfile,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  createEmployee: vi.fn(),
  checkInvitation: vi.fn(),
  signupWithInvitation: vi.fn(),
};

export const createMockInventoryAuthContext = (overrides = {}) => ({
  ...mockInventoryAuthContextValue,
  ...overrides,
});

// Mock Store Data
export const mockStores = [
  {
    id: 'store-123',
    name: 'Main Store',
    address: '123 Main St, City',
    phone: '555-0100',
    ownerUid: 'master-uid-123',
    employeeCount: 2,
    productCount: 50,
    createdAt: { toDate: () => new Date('2026-01-01') },
    updatedAt: { toDate: () => new Date('2026-01-20') },
  },
  {
    id: 'store-456',
    name: 'Downtown Branch',
    address: '456 Downtown Ave, City',
    phone: '555-0200',
    ownerUid: 'master-uid-123',
    employeeCount: 1,
    productCount: 30,
    createdAt: { toDate: () => new Date('2026-01-10') },
    updatedAt: { toDate: () => new Date('2026-01-15') },
  },
];

// Mock Employee Data
export const mockEmployees = [
  {
    id: 'employee-1',
    uid: 'member-uid-456',
    email: 'john@store.com',
    displayName: 'John Employee',
    phone: '555-1001',
    role: 'member',
    ownerUid: 'master-uid-123',
    assignedStoreId: 'store-123',
    assignedStoreName: 'Main Store',
    isActive: true,
    createdAt: { toDate: () => new Date('2026-01-05') },
  },
  {
    id: 'employee-2',
    uid: 'member-uid-789',
    email: 'jane@store.com',
    displayName: 'Jane Worker',
    phone: '555-1002',
    role: 'member',
    ownerUid: 'master-uid-123',
    assignedStoreId: 'store-456',
    assignedStoreName: 'Downtown Branch',
    isActive: true,
    createdAt: { toDate: () => new Date('2026-01-12') },
  },
];

// Mock Product Data
export const mockProducts = [
  {
    id: 'product-1',
    name: 'iPhone 16 Pro Max',
    sku: 'IPH-16-PRO-MAX',
    description: 'Latest iPhone model',
    category: 'Smartphones',
    price: 1199.99,
    cost: 900,
    quantity: 25,
    lowStockThreshold: 5,
    storeId: 'store-123',
    ownerUid: 'master-uid-123',
    createdAt: { toDate: () => new Date('2026-01-01') },
    updatedAt: { toDate: () => new Date('2026-01-20') },
  },
  {
    id: 'product-2',
    name: 'Samsung Galaxy S25',
    sku: 'SAM-S25',
    description: 'Samsung flagship phone',
    category: 'Smartphones',
    price: 999.99,
    cost: 750,
    quantity: 15,
    lowStockThreshold: 5,
    storeId: 'store-123',
    ownerUid: 'master-uid-123',
    createdAt: { toDate: () => new Date('2026-01-05') },
    updatedAt: { toDate: () => new Date('2026-01-18') },
  },
  {
    id: 'product-3',
    name: 'AirPods Pro 3',
    sku: 'APP-3',
    description: 'Apple wireless earbuds',
    category: 'Accessories',
    price: 249.99,
    cost: 180,
    quantity: 3,
    lowStockThreshold: 10,
    storeId: 'store-123',
    ownerUid: 'master-uid-123',
    createdAt: { toDate: () => new Date('2026-01-10') },
    updatedAt: { toDate: () => new Date('2026-01-15') },
  },
];

// Mock Sales Data
export const mockSales = [
  {
    id: 'sale-1',
    storeId: 'store-123',
    ownerUid: 'master-uid-123',
    employeeId: 'member-uid-456',
    employeeName: 'John Employee',
    items: [
      {
        productId: 'product-1',
        productName: 'iPhone 16 Pro Max',
        sku: 'IPH-16-PRO-MAX',
        price: 1199.99,
        quantity: 1,
        subtotal: 1199.99,
      },
    ],
    subtotal: 1199.99,
    tax: 0,
    total: 1199.99,
    itemCount: 1,
    paymentMethod: 'Card',
    customerName: 'Walk-in Customer',
    status: 'completed',
    createdAt: { toDate: () => new Date('2026-01-20T10:30:00') },
  },
  {
    id: 'sale-2',
    storeId: 'store-123',
    ownerUid: 'master-uid-123',
    employeeId: 'member-uid-456',
    employeeName: 'John Employee',
    items: [
      {
        productId: 'product-2',
        productName: 'Samsung Galaxy S25',
        sku: 'SAM-S25',
        price: 999.99,
        quantity: 1,
        subtotal: 999.99,
      },
      {
        productId: 'product-3',
        productName: 'AirPods Pro 3',
        sku: 'APP-3',
        price: 249.99,
        quantity: 2,
        subtotal: 499.98,
      },
    ],
    subtotal: 1499.97,
    tax: 0,
    total: 1499.97,
    itemCount: 3,
    paymentMethod: 'Cash',
    customerName: 'John Doe',
    customerPhone: '555-9999',
    status: 'completed',
    createdAt: { toDate: () => new Date('2026-01-21T14:15:00') },
  },
];

// Mock Invitation Data
export const mockInvitation = {
  id: 'ABCD1234',
  email: 'newemployee@store.com',
  name: 'New Employee',
  phone: '555-5555',
  assignedStoreId: 'store-123',
  assignedStoreName: 'Main Store',
  ownerUid: 'master-uid-123',
  status: 'pending',
  createdAt: { toDate: () => new Date('2026-01-22') },
};
