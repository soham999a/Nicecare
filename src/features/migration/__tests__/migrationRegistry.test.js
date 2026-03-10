import { describe, it, expect } from 'vitest';
import {
  ENTITY_TYPES,
  MIGRATION_ENTITY_SPECS,
  getEntitySpec,
  getMappableFields,
  inferEntityFromSheetName,
} from '../migrationRegistry';

describe('migrationRegistry', () => {
  it('ENTITY_TYPES includes all core entities', () => {
    expect(ENTITY_TYPES).toContain('stores');
    expect(ENTITY_TYPES).toContain('products');
    expect(ENTITY_TYPES).toContain('employees');
    expect(ENTITY_TYPES).toContain('customers');
    expect(ENTITY_TYPES).toHaveLength(4);
  });

  it('each entity has collection, label, fields, requiredFields, computedFields', () => {
    for (const id of ENTITY_TYPES) {
      const spec = MIGRATION_ENTITY_SPECS[id];
      expect(spec).toBeDefined();
      expect(spec.collection).toBeTruthy();
      expect(spec.label).toBeTruthy();
      expect(Array.isArray(spec.fields)).toBe(true);
      expect(Array.isArray(spec.requiredFields)).toBe(true);
      expect(Array.isArray(spec.computedFields)).toBe(true);
    }
  });

  it('getEntitySpec returns spec for valid id', () => {
    const spec = getEntitySpec('stores');
    expect(spec).toBeDefined();
    expect(spec.collection).toBe('stores');
    expect(spec.requiredFields).toContain('name');
  });

  it('getEntitySpec returns undefined for invalid id', () => {
    expect(getEntitySpec('unknown')).toBeUndefined();
  });

  it('getMappableFields returns fields for valid entity', () => {
    const fields = getMappableFields('products');
    expect(fields.length).toBeGreaterThan(0);
    const priceField = fields.find((f) => f.firestoreField === 'price');
    expect(priceField).toBeDefined();
    expect(priceField.coercion).toBe('parseFloat');
  });

  describe('inferEntityFromSheetName', () => {
    it('infers stores from sheet name', () => {
      expect(inferEntityFromSheetName('Stores')).toBe('stores');
      expect(inferEntityFromSheetName('Store')).toBe('stores');
      expect(inferEntityFromSheetName('stores')).toBe('stores');
    });

    it('infers products from sheet name', () => {
      expect(inferEntityFromSheetName('Products')).toBe('products');
      expect(inferEntityFromSheetName('product')).toBe('products');
    });

    it('infers employees from sheet name', () => {
      expect(inferEntityFromSheetName('Employees')).toBe('employees');
    });

    it('infers customers from sheet name or CRM', () => {
      expect(inferEntityFromSheetName('Customers')).toBe('customers');
      expect(inferEntityFromSheetName('CRM')).toBe('customers');
    });

    it('returns empty string for unknown sheet name', () => {
      expect(inferEntityFromSheetName('Sheet1')).toBe('');
      expect(inferEntityFromSheetName('Data')).toBe('');
      expect(inferEntityFromSheetName('')).toBe('');
    });
  });
});
