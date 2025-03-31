import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { TransactionUtils } from './transaction.utils';
import { CurrencySymbol } from '../schema/currency.schema';
import { Model } from 'mongoose';

describe('TransactionUtils', () => {
  let transactionUtils: TransactionUtils;
  let currencyModel: Model<CurrencySymbol>;

  // Mock implementation for the CurrencySymbol model
  const mockCurrencyModel = {
    findOne: jest.fn().mockReturnThis(), // Chainable mock
    exec: jest.fn(), // Mock exec() for async execution
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionUtils,
        {
          provide: getModelToken(CurrencySymbol.name),
          useValue: mockCurrencyModel,
        },
      ],
    }).compile();

    transactionUtils = module.get<TransactionUtils>(TransactionUtils);
    currencyModel = module.get<Model<CurrencySymbol>>(
      getModelToken(CurrencySymbol.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks after each test
  });

  it('should be defined', () => {
    expect(transactionUtils).toBeDefined();
  });

  describe('validateCurrencyCode', () => {
    it('should return true for a valid currency code', async () => {
      // Mock a successful findOne result
      mockCurrencyModel.findOne.mockReturnThis();
      mockCurrencyModel.exec.mockResolvedValue({ code: 'NGN' });

      const result = await transactionUtils.validateCurrencyCode('NGN');
      expect(result).toBe(true);
      expect(currencyModel.findOne).toHaveBeenCalledWith({ code: 'NGN' });
    });

    it('should throw NotFoundException for an invalid currency code', async () => {
      // Mock a null result for an invalid code
      mockCurrencyModel.findOne.mockReturnThis();
      mockCurrencyModel.exec.mockResolvedValue(null);

      await expect(
        transactionUtils.validateCurrencyCode('XYZ'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        transactionUtils.validateCurrencyCode('XYZ'),
      ).rejects.toThrow('invalid currency code');
      expect(currencyModel.findOne).toHaveBeenCalledWith({ code: 'XYZ' });
    });

    it('should throw an error for database errors', async () => {
      // Mock a database error
      mockCurrencyModel.findOne.mockReturnThis();
      mockCurrencyModel.exec.mockRejectedValue(new Error('Database error'));

      await expect(
        transactionUtils.validateCurrencyCode('NGN'),
      ).rejects.toThrow('Database error');
      expect(currencyModel.findOne).toHaveBeenCalledWith({ code: 'NGN' });
    });
  });
});
