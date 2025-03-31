// src/accounts/accounts.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import { Decimal128 } from 'mongodb';
import { User } from 'src/auth/schema/user.schema';
import { Account } from './schema/account.schema';
import { UserUtils } from 'src/auth/utils/user.validator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verifyPassword } from 'src/common/utils/helper';

describe('AccountsService', () => {
  let accountsService: AccountsService;
  const mockAccountModel = {
    findOne: jest.fn(),
  };
  const mockUserModel = {};
  const mockJwtService = {};
  const mockUserUtils = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Account.name), useValue: mockAccountModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserUtils, useValue: mockUserUtils },
      ],
    }).compile();

    accountsService = module.get<AccountsService>(AccountsService);
    (accountsService as any).userUtils = mockUserUtils; // Manually assign the mock
    (accountsService as any).Bank_Name = 'Test Bank'; // Mock the BANK_NAME
  });

  it('should be defined', () => {
    expect(accountsService).toBeDefined();
  });

  describe('getAccountDetails', () => {
    it('should return account details successfully', async () => {
      const mockAccount = {
        _id: 'account_id',
        user: { _id: 'user_id', firstName: 'John', lastName: 'Doe' },
        accountNumber: '1234567890',
        balance: Decimal128.fromString('100'),
        currency: 'NGN',
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          _id: 'account_id',
          user: { _id: 'user_id', firstName: 'John', lastName: 'Doe' },
          accountNumber: '1234567890',
          balance: Decimal128.fromString('100'),
          currency: 'NGN',
        }),
      };

      mockAccountModel.findOne.mockResolvedValue(mockAccount);
      mockUserUtils.validateUser.mockResolvedValue({});

      const result = await accountsService.getAccountDetails({
        user: { _id: 'user_id' },
      } as any);

      expect(result).toBeDefined();
      expect(result.data.customer_name).toEqual('John Doe');
      expect(mockAccountModel.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if account is not found', async () => {
      mockAccountModel.findOne.mockResolvedValue(null);
      mockUserUtils.validateUser.mockResolvedValue({});

      await expect(
        accountsService.getAccountDetails({ user: { _id: 'user_id' } } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserAccountDetails', () => {
    it('should return user account details successfully', async () => {
      const mockAccount = {
        _id: 'account_id',
        user: { _id: 'user_id_2', firstName: 'Jane', lastName: 'Smith' },
        accountNumber: '9876543210',
        currency: 'USD',
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          _id: 'account_id',
          user: { _id: 'user_id_2', firstName: 'Jane', lastName: 'Smith' },
          accountNumber: '9876543210',
          currency: 'USD',
        }),
      };

      mockAccountModel.findOne.mockResolvedValue(mockAccount);
      mockUserUtils.validateUser.mockResolvedValue({});

      const result = await accountsService.getUserAccountDetails(
        { user: { _id: 'user_id' } } as any,
        'user_id_2',
      );

      expect(result).toBeDefined();
      expect(result.data.customer_name).toEqual('Jane Smith');
      expect(mockAccountModel.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user account is not found', async () => {
      mockAccountModel.findOne.mockResolvedValue(null);
      mockUserUtils.validateUser.mockResolvedValue({});

      await expect(
        accountsService.getUserAccountDetails(
          { user: { _id: 'user_id' } } as any,
          'user_id_2',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
