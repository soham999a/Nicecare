import { describe, it, expect } from 'vitest';
import { getFunctionsUrl, assertBackendConfig } from '../config';
import { API_CONTRACTS } from '../../contracts/apiContracts';
import { FORM_MAPPINGS, EMPLOYEE_FORM_TO_FIRESTORE, PRODUCT_FORM_TO_FIRESTORE } from '../../contracts/formMappings';
import { COLLECTIONS } from '../../firestore/collections';

describe('Backend config and contracts', () => {
  describe('config', () => {
    it('getFunctionsUrl returns string', () => {
      expect(typeof getFunctionsUrl()).toBe('string');
    });

    it('assertBackendConfig returns object with functionsUrl', () => {
      const config = assertBackendConfig();
      expect(config).toHaveProperty('functionsUrl');
      expect(typeof config.functionsUrl).toBe('string');
    });
  });

  describe('API contracts', () => {
    it('defines expected Cloud Function endpoints', () => {
      expect(API_CONTRACTS.askAboutInventory).toEqual({
        method: 'POST',
        body: ['question', 'userRole', 'assignedStoreId', 'ownerUidForMember'],
      });
      expect(API_CONTRACTS.submitFeedback.body).toContain('messageId');
      expect(API_CONTRACTS.submitFeedback.body).toContain('rating');
      expect(API_CONTRACTS.submitFeedback.body).toContain('module');
    });
  });

  describe('form mappings', () => {
    it('employee form maps name to displayName', () => {
      const nameMapping = EMPLOYEE_FORM_TO_FIRESTORE.mappings.find((m) => m.formField === 'name');
      expect(nameMapping).toBeDefined();
      expect(nameMapping.firestoreField).toBe('displayName');
    });

    it('product form has storeId and storeName', () => {
      const mappings = PRODUCT_FORM_TO_FIRESTORE.mappings;
      expect(mappings.some((m) => m.formField === 'storeId' && m.firestoreField === 'storeId')).toBe(true);
      expect(mappings.some((m) => m.formField === 'storeName' && m.firestoreField === 'storeName')).toBe(true);
    });

    it('FORM_MAPPINGS includes employees, products, stores, salesReport', () => {
      expect(FORM_MAPPINGS).toHaveProperty('employees');
      expect(FORM_MAPPINGS).toHaveProperty('products');
      expect(FORM_MAPPINGS).toHaveProperty('stores');
      expect(FORM_MAPPINGS).toHaveProperty('salesReport');
    });
  });

  describe('collections', () => {
    it('COLLECTIONS has expected names', () => {
      expect(COLLECTIONS.CRM_INTERNAL_USER_PROFILES).toBe('crmInternalUserProfiles');
      expect(COLLECTIONS.EXTERNAL_CUSTOMER_RECORDS).toBe('externalCustomerRecords');
      expect(COLLECTIONS.INVENTORY_INTERNAL_USER_PROFILES).toBe('inventoryInternalUserProfiles');
      expect(COLLECTIONS.STORE_STAFF_ASSIGNMENTS).toBe('storeStaffAssignments');
      expect(COLLECTIONS.BUSINESS_STORE_LOCATIONS).toBe('businessStoreLocations');
      expect(COLLECTIONS.INVENTORY_PRODUCT_CATALOG).toBe('inventoryProductCatalog');
      expect(COLLECTIONS.SALES_TRANSACTION_RECORDS).toBe('salesTransactionRecords');
      expect(COLLECTIONS.INVENTORY_STOCK_MOVEMENT_LOGS).toBe('inventoryStockMovementLogs');
      expect(COLLECTIONS.STAFF_ONBOARDING_INVITATIONS).toBe('staffOnboardingInvitations');
      expect(COLLECTIONS.CHATBOT_FEEDBACK_SUBMISSIONS).toBe('chatbotFeedbackSubmissions');
    });
  });
});
