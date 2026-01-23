import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const mockLowStockProducts = [
  {
    id: 'product-1',
    name: 'AirPods Pro 3',
    sku: 'APP-3',
    quantity: 3,
    lowStockThreshold: 10,
    storeName: 'Main Store',
  },
  {
    id: 'product-2',
    name: 'iPhone Case',
    sku: 'CASE-001',
    quantity: 2,
    lowStockThreshold: 5,
    storeName: 'Main Store',
  },
  {
    id: 'product-3',
    name: 'USB-C Cable',
    sku: 'USBC-001',
    quantity: 0,
    lowStockThreshold: 20,
    storeName: 'Downtown Branch',
  },
];

import LowStockAlert from '../LowStockAlert';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LowStockAlert Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when no low stock products', () => {
      const { container } = renderWithRouter(
        <LowStockAlert products={[]} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when products is null', () => {
      const { container } = renderWithRouter(
        <LowStockAlert products={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render alert when there are low stock products', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
    });

    it('should display count of low stock items', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText(/3 products running low/i)).toBeInTheDocument();
    });

    it('should display singular text for one product', () => {
      renderWithRouter(
        <LowStockAlert products={[mockLowStockProducts[0]]} />
      );

      expect(screen.getByText(/1 product running low/i)).toBeInTheDocument();
    });

    it('should display product names', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText('AirPods Pro 3')).toBeInTheDocument();
      expect(screen.getByText('iPhone Case')).toBeInTheDocument();
      expect(screen.getByText('USB-C Cable')).toBeInTheDocument();
    });

    it('should display product SKUs', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText('APP-3')).toBeInTheDocument();
      expect(screen.getByText('CASE-001')).toBeInTheDocument();
    });

    it('should display current stock quantities', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText('3 left')).toBeInTheDocument();
      expect(screen.getByText('2 left')).toBeInTheDocument();
      expect(screen.getByText('0 left')).toBeInTheDocument();
    });

    it('should display View All link', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('should link to products page', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      const link = screen.getByText('View All');
      expect(link.getAttribute('href')).toBe('/inventory/products');
    });
  });

  describe('Product Limiting', () => {
    it('should only show first 5 products', () => {
      const manyProducts = [
        ...mockLowStockProducts,
        { id: 'p4', name: 'Product 4', sku: 'P4', quantity: 1 },
        { id: 'p5', name: 'Product 5', sku: 'P5', quantity: 1 },
        { id: 'p6', name: 'Product 6', sku: 'P6', quantity: 1 },
        { id: 'p7', name: 'Product 7', sku: 'P7', quantity: 1 },
      ];

      renderWithRouter(
        <LowStockAlert products={manyProducts} />
      );

      // Should show "+X more items" text
      expect(screen.getByText('+2 more items')).toBeInTheDocument();
    });

    it('should not show more items text when 5 or fewer products', () => {
      renderWithRouter(
        <LowStockAlert products={mockLowStockProducts} />
      );

      expect(screen.queryByText(/more items/)).not.toBeInTheDocument();
    });
  });

  describe('No SKU handling', () => {
    it('should display No SKU for products without SKU', () => {
      const productsWithoutSku = [
        { id: 'p1', name: 'Product Without SKU', quantity: 5 },
      ];

      renderWithRouter(
        <LowStockAlert products={productsWithoutSku} />
      );

      expect(screen.getByText('No SKU')).toBeInTheDocument();
    });
  });
});
