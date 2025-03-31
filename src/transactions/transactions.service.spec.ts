import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionUtils } from './utils/transaction.utils';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Account } from 'src/accounts/schema/account.schema';
import { Transaction } from './schema/transaction.schema';
import { LedgerEntry } from './schema/ledger.schema';
import { CurrencySymbol } from './schema/currency.schema';
import { UserUtils } from 'src/auth/utils/user.validator';
import { Status } from 'src/common/enums/status.enums';
import { Decimal128 } from 'mongodb';
import { GetTransactionsDto } from './dto/transactions.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verifyPassword } from 'src/common/utils/helper';

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  const mockAccountModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    db: {
      startSession: jest.fn(),
    },
  };
  const mockTransactionModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockLedgerEntryModel = { create: jest.fn() };
  const mockCurrencyModel = { find: jest.fn(), insertMany: jest.fn() };
  const mockTransactionUtils = {
    validateCurrencyCode: jest.fn(),
  };
  const mockUserUtils = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getModelToken(Account.name), useValue: mockAccountModel },
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: getModelToken(LedgerEntry.name),
          useValue: mockLedgerEntryModel,
        },
        {
          provide: getModelToken(CurrencySymbol.name),
          useValue: mockCurrencyModel,
        },
        { provide: TransactionUtils, useValue: mockTransactionUtils },
        { provide: UserUtils, useValue: mockUserUtils },
      ],
    }).compile();

    transactionsService = module.get<TransactionsService>(TransactionsService);
    mockAccountModel.db.startSession.mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
      inTransaction: jest.fn(),
    });
  });

  it('should be defined', () => {
    expect(transactionsService).toBeDefined();
  });

  describe('getCurrencies', () => {
    it('should get all currencies without search', async () => {
      mockUserUtils.validateUser.mockResolvedValue({});
      mockCurrencyModel.find.mockResolvedValue([]);
      const result = await transactionsService.getCurrencies({
        user: { _id: 'user_id' },
      } as any);
      expect(result).toBeDefined();
    });

    it('should get currencies with search', async () => {
      mockUserUtils.validateUser.mockResolvedValue({});
      mockCurrencyModel.find.mockResolvedValue([]);
      const result = await transactionsService.getCurrencies(
        { user: { _id: 'user_id' } } as any,
        'USD',
      );
      expect(result).toBeDefined();
    });
  });

  describe('deposit', () => {
    it('should deposit successfully', async () => {
      const mockAccount = {
        _id: 'account_id',
        accountNumber: '1234567890',
        status: Status.VERIFIED,
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      };
      const mockTransaction = [{ _id: 'transaction_id' }];
      mockAccountModel.findOneAndUpdate.mockResolvedValue(mockAccount);
      mockTransactionModel.create.mockResolvedValue(mockTransaction);
      mockAccountModel.findOne.mockResolvedValue({ _id: 'cash_account_id' });
      mockLedgerEntryModel.create.mockResolvedValue([]);
      mockTransactionUtils.validateCurrencyCode.mockResolvedValue(undefined);
      const depositDto = {
        accountNumber: '1234567890',
        amount: 50,
        currency: 'NGN',
        description: 'Deposit',
        depositorFirstName: 'John',
        depositorLastName: 'Doe',
      };
      const result = await transactionsService.deposit(depositDto);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if account not found', async () => {
      mockAccountModel.findOneAndUpdate.mockResolvedValue(null);
      const depositDto = {
        accountNumber: '1234567890',
        amount: 50,
        currency: 'NGN',
        description: 'Deposit',
        depositorFirstName: 'John',
        depositorLastName: 'Doe',
      };
      await expect(transactionsService.deposit(depositDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('withdraw', () => {
    it('should withdraw successfully', async () => {
      const mockUser = {
        _id: 'user_id',
        isPinSet: true,
        pin: 'hashed_pin',
      };
      const mockAccount = {
        _id: 'account_id',
        user: 'user_id',
        accountNumber: '1234567890',
        status: Status.VERIFIED,
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      };
      const mockTransaction = [{ _id: 'transaction_id' }];
      mockUserUtils.validateUser.mockResolvedValue(mockUser);
      mockAccountModel.findOne.mockResolvedValue(mockAccount);
      mockTransactionModel.create.mockResolvedValue(mockTransaction);
      mockAccountModel.findOne.mockResolvedValue({ _id: 'cash_account_id' });
      mockLedgerEntryModel.create.mockResolvedValue([]);
      mockTransactionUtils.validateCurrencyCode.mockResolvedValue(undefined);
      (verifyPassword as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      const withdrawDto = {
        amount: 50,
        currency: 'NGN',
        description: 'Withdrawal',
      };
      const result = await transactionsService.withdraw(
        { user: { _id: 'user_id' } } as any,
        withdrawDto,
        '1234',
      );
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if pin is not set', async () => {
      mockUserUtils.validateUser.mockResolvedValue({
        _id: 'user_id',
        isPinSet: false,
      });
      const withdrawDto = {
        amount: 50,
        currency: 'NGN',
        description: 'Withdrawal',
      };
      await expect(
        transactionsService.withdraw(
          { user: { _id: 'user_id' } } as any,
          withdrawDto,
          '1234',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('transfer', () => {
    it('should transfer successfully', async () => {
      const mockUser = {
        _id: 'user_id',
        isPinSet: true,
        pin: 'hashed_pin',
        firstName: 'Sender',
        lastName: 'Name',
      };
      const mockSenderAccount = {
        _id: 'sender_id',
        user: 'user_id',
        accountNumber: '1234567890',
        status: Status.VERIFIED,
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      };
      const mockRecipientAccount = {
        _id: 'recipient_id',
        accountNumber: '9876543210',
        status: Status.VERIFIED,
        balance: Decimal128.fromString('0'),
        transactions: [],
        save: jest.fn(),
      };
      const mockTransactions = [{ _id: 'trans_id_1' }, { _id: 'trans_id_2' }];
      mockUserUtils.validateUser.mockResolvedValue(mockUser);
      mockAccountModel.findOne
        .mockResolvedValueOnce(mockSenderAccount)
        .mockResolvedValueOnce(mockRecipientAccount);
      mockTransactionModel.create.mockResolvedValue(mockTransactions);
      mockTransactionUtils.validateCurrencyCode.mockResolvedValue(undefined);
      (verifyPassword as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      const transferDto = {
        accountNumber: '9876543210',
        amount: 50,
        currency: 'NGN',
        description: 'Transfer',
      };
      const result = await transactionsService.transfer(
        { user: { _id: 'user_id' } } as any,
        transferDto,
        '1234',
      );
      expect(result).toBeDefined();
    });
  });

  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      mockUserUtils.validateUser.mockResolvedValue({});
      mockAccountModel.findOne.mockResolvedValue({
        transactions: ['trans_id'],
      });
      mockTransactionModel.find.mockResolvedValue([]);
      mockTransactionModel.countDocuments.mockResolvedValue(0);
      const result = await transactionsService.getTransactions(
        { user: { _id: 'user_id' } } as any,
        {} as GetTransactionsDto,
      );
      expect(result).toBeDefined();
    });
  });

  describe('getTransaction', () => {
    it('should get transaction successfully', async () => {
      mockUserUtils.validateUser.mockResolvedValue({});
      mockAccountModel.findOne.mockResolvedValue({
        transactions: ['trans_id'],
      });
      mockTransactionModel.findById.mockResolvedValue({});
      const result = await transactionsService.getTransaction(
        { user: { _id: 'user_id' } } as any,
        'trans_id',
      );
      expect(result).toBeDefined();
    });
  });
});
