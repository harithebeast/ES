import { describe, it, expect } from 'vitest';
import { createBuyerSchema } from '../validation/buyer';

describe('Buyer Validation', () => {
  describe('Budget validation', () => {
    it('should pass when budgetMin is less than budgetMax', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 1000000,
        budgetMax: 2000000,
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should pass when budgetMin equals budgetMax', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 1500000,
        budgetMax: 1500000,
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail when budgetMin is greater than budgetMax', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 2000000,
        budgetMax: 1000000,
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.budgetMax).toContain('budgetMax must be ≥ budgetMin');
      }
    });

    it('should pass when only budgetMin is provided', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 1000000,
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should pass when only budgetMax is provided', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMax: 2000000,
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should pass when neither budgetMin nor budgetMax is provided', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('BHK validation', () => {
    it('should require BHK for Apartment', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.bhk).toContain('bhk is required for Apartment/Villa');
      }
    });

    it('should require BHK for Villa', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Villa',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.bhk).toContain('bhk is required for Apartment/Villa');
      }
    });

    it('should not require BHK for Plot', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
