import { TransactionsService } from './transactions.service';
import { User } from 'src/auth/schema/user.schema';
import { Model, Types } from 'mongoose';
import { Account } from 'src/accounts/schema/account.schema';
import { Transaction } from './schema/transaction.schema';
import { CurrencySymbol } from './schema/currency.schema';
import { LedgerEntry } from './schema/ledger.schema';
import { JwtService } from '@nestjs/jwt';
import { UserUtils } from 'src/auth/utils/user.validator';
import { TransactionUtils } from './utils/transaction.utils';
import { ICurrency } from 'src/common/interfaces/general.interface';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DepositTransactionDto } from './dto/deposit-transaction.dto';
import { Decimal128 } from 'mongodb';
import { convertCurrency, verifyPassword } from 'src/common/utils/helper';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { WithdrawTransactionDto } from './dto/withdrawal-transaction.dto';
// import { TransferTransactionDto } from './dto/transfer-transaction.dto';

jest.mock('src/common/utils/helper');

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockUserModel: any;
  let mockAccountModel: any;
  let mockTransactionModel: any;
  let mockCurrencyModel: any;
  let mockLedgerModel: any;
  let mockJwtService: any;
  let mockUserUtils: any;
  let mockTransactionUtils: any;
  let mockRequest: any;

  beforeEach(() => {
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };
    mockAccountModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
      db: {
        startSession: jest.fn().mockReturnValue({
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
          inTransaction: jest.fn().mockReturnValue(true),
        }),
      },
    };
    mockTransactionModel = {
      create: jest.fn(),
    };
    mockCurrencyModel = {
      findOne: jest.fn(),
      find: jest.fn(() => ({
        select: jest.fn().mockResolvedValue([]),
      })),
    };
    mockLedgerModel = {
      create: jest.fn(),
    };
    mockJwtService = {};
    mockUserUtils = new UserUtils(
      mockUserModel as Model<User>,
      mockAccountModel as Model<Account>,
    );
    mockTransactionUtils = new TransactionUtils(
      mockCurrencyModel as Model<CurrencySymbol>,
    );

    service = new TransactionsService(
      mockUserModel as Model<User>,
      mockAccountModel as Model<Account>,
      mockTransactionModel as Model<Transaction>,
      mockCurrencyModel as Model<CurrencySymbol>,
      mockLedgerModel as Model<LedgerEntry>,
      mockJwtService as JwtService,
    );

    service.userUtils = mockUserUtils;
    service.transactionUtils = mockTransactionUtils;

    mockRequest = {
      user: {
        _id: new Types.ObjectId('65123abcd456ef7890123456'),
        mobileNumber: '07012345678',
        status: 'verified',
      },
    };
  });

  // Get currencies
  describe('getCurrencies', () => {
    it('should return a list of currencies', async () => {
      jest
        .spyOn(service.userUtils, 'validateUser')
        .mockResolvedValue(undefined);

      const expectedCurrencies: ICurrency[] = [
        {
          _id: '67e96deb568919dc1e4b85f8',
          code: 'CLF',
          currency: 'Unidad de Fomento',
        },
        {
          _id: '67e96deb568919dc1e4b860b',
          code: 'FKP',
          currency: 'Falkland Islands Pound',
        },
      ];

      mockCurrencyModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(expectedCurrencies),
      });

      const result = await service.getCurrencies(mockRequest);

      expect(result).toEqual({
        msg: 'Currencies retrieve successfully',
        data: expectedCurrencies,
      });
      expect(mockCurrencyModel.find).toHaveBeenCalled();
      expect(service.userUtils.validateUser).toHaveBeenCalledWith(
        mockRequest.user._id,
      );
    });

    it('should filter currencies based on search term', async () => {
      const mockCurrencies: ICurrency[] = [
        {
          _id: '123456778',
          code: 'USD',
          currency: 'United States Dollar',
        },
      ];

      jest
        .spyOn(service.userUtils, 'validateUser')
        .mockResolvedValue(undefined);

      mockCurrencyModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockCurrencies),
      });

      const req: any = { user: { _id: new Types.ObjectId() } };
      const result = await service.getCurrencies(req, 'USD');

      expect(result).toEqual({
        msg: 'Currencies retrieve successfully',
        data: mockCurrencies,
      });
      expect(mockCurrencyModel.find).toHaveBeenCalledWith({
        $or: [
          { code: { $regex: 'USD', $options: 'i' } },
          { currency: { $regex: 'USD', $options: 'i' } },
        ],
      });
      expect(service.userUtils.validateUser).toHaveBeenCalledWith(req.user._id);
    });

    it('should throw UnauthorizedException if user is not valid', async () => {
      jest
        .spyOn(service.userUtils, 'validateUser')
        .mockRejectedValue(new UnauthorizedException());

      const req: any = { user: { _id: new Types.ObjectId() } };

      await expect(service.getCurrencies(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // Deposit
  describe('deposit', () => {
    const mockDepositDto: DepositTransactionDto = {
      accountNumber: '1234567890',
      amount: 100,
      currency: 'NGN',
      description: 'Test deposit',
      depositorFirstName: 'John',
      depositorLastName: 'Doe',
    };

    it('should successfully deposit into the account', async () => {
      jest
        .spyOn(service.transactionUtils, 'validateCurrencyCode')
        .mockResolvedValue(undefined);

      mockAccountModel.findOneAndUpdate.mockResolvedValue({
        accountNumber: mockDepositDto.accountNumber,
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      });

      mockTransactionModel.create.mockResolvedValue([
        { _id: new Types.ObjectId() },
      ]);
      mockAccountModel.findOne.mockResolvedValue({
        accountNumber: 'SYSTEM_CASH',
        balance: Decimal128.fromString('0'),
        save: jest.fn(),
      });

      const result = await service.deposit(mockDepositDto);

      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if account is not found', async () => {
      mockAccountModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.deposit(mockDepositDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should convert currency and deposit if currency is not NGN', async () => {
      const foreignDepositDto: DepositTransactionDto = {
        ...mockDepositDto,
        currency: 'USD',
      };

      (convertCurrency as jest.Mock).mockResolvedValue(1000);
      mockCurrencyModel.findOne.mockResolvedValue({ code: 'USD' });

      mockAccountModel.findOneAndUpdate.mockResolvedValue({
        accountNumber: foreignDepositDto.accountNumber,
        balance: Decimal128.fromString('1000'),
        transactions: [],
        save: jest.fn(),
      });

      mockTransactionModel.create.mockResolvedValue([
        { _id: new Types.ObjectId() },
      ]);

      mockAccountModel.findOne.mockResolvedValue({
        accountNumber: 'SYSTEM_CASH',
        balance: Decimal128.fromString('0'),
        save: jest.fn(),
      });

      const result = await service.deposit(foreignDepositDto);

      expect(convertCurrency).toHaveBeenCalled();
      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if convertCurrency fails', async () => {
      const foreignDepositDto: DepositTransactionDto = {
        ...mockDepositDto,
        currency: 'USD',
      };

      (convertCurrency as jest.Mock).mockRejectedValue(
        new Error('Currency conversion failed'),
      );
      mockCurrencyModel.findOne.mockResolvedValue({ code: 'USD' });

      await expect(service.deposit(foreignDepositDto)).rejects.toThrowError(
        'Currency conversion failed',
      );
    });

    it('should throw error if transaction fails and abort the session', async () => {
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(true),
      };
      mockAccountModel.db.startSession.mockReturnValue(sessionMock);
      mockAccountModel.findOneAndUpdate.mockRejectedValue(
        new Error('Transaction failed'),
      );

      jest
        .spyOn(service.transactionUtils, 'validateCurrencyCode')
        .mockResolvedValue(undefined);
      mockCurrencyModel.findOne.mockResolvedValue({ code: 'NGN' });

      await expect(service.deposit(mockDepositDto)).rejects.toThrowError(
        'Transaction failed',
      );
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw error if validateCurrencyCode fails', async () => {
      jest
        .spyOn(service.transactionUtils, 'validateCurrencyCode')
        .mockRejectedValue(new Error('Invalid currency code'));

      await expect(service.deposit(mockDepositDto)).rejects.toThrowError(
        'Invalid currency code',
      );
    });
  });

  //Withdraw
  describe('withdraw', () => {
    const mockWithdrawDto: WithdrawTransactionDto = {
      amount: 50,
      currency: 'NGN',
      description: 'Test withdrawal',
    };
    const mockPin = '1234';

    it('should successfully withdraw from the account', async () => {
      mockUserModel.findById.mockResolvedValue({
        _id: new Types.ObjectId(),
        isPinSet: true,
        pin: 'hashedPin',
      });
      mockAccountModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      });
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      mockTransactionModel.create.mockResolvedValue([
        { _id: new Types.ObjectId() },
      ]);
      mockAccountModel.findOne.mockResolvedValueOnce({
        accountNumber: 'SYSTEM_CASH',
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      });
      mockLedgerModel.create.mockResolvedValue(undefined);

      mockCurrencyModel.findOne.mockResolvedValue({ code: 'NGN' });

      const result = await service.withdraw(
        mockRequest as CustomRequest,
        mockWithdrawDto,
        mockPin,
      );

      expect(result).toBeDefined();
    });

    it('should throw ConflictException if pin is not set', async () => {
      mockUserModel.findById.mockResolvedValue({ isPinSet: false });

      await expect(
        service.withdraw(
          mockRequest as CustomRequest,
          mockWithdrawDto,
          mockPin,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if account is not found', async () => {
      mockUserModel.findById.mockResolvedValue({ isPinSet: true });
      mockAccountModel.findOne.mockResolvedValue(null);

      await expect(
        service.withdraw(
          mockRequest as CustomRequest,
          mockWithdrawDto,
          mockPin,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      mockUserModel.findById.mockResolvedValue({ isPinSet: true });
      mockAccountModel.findOne.mockResolvedValue({
        balance: Decimal128.fromString('10'),
      });
      mockCurrencyModel.findOne.mockResolvedValue({ code: 'NGN' });

      await expect(
        service.withdraw(
          mockRequest as CustomRequest,
          mockWithdrawDto,
          mockPin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if SYSTEM_CASH account is not found', async () => {
      mockUserModel.findById.mockResolvedValue({ isPinSet: true });
      mockAccountModel.findOne.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        balance: Decimal128.fromString('100'),
        transactions: [],
        save: jest.fn(),
      });
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      mockTransactionModel.create.mockResolvedValue([
        { _id: new Types.ObjectId() },
      ]);
      mockAccountModel.findOne.mockResolvedValueOnce(null);

      mockCurrencyModel.findOne.mockResolvedValue({ code: 'NGN' });

      await expect(
        service.withdraw(
          mockRequest as CustomRequest,
          mockWithdrawDto,
          mockPin,
        ),
      ).rejects.toThrowError('SYSTEM_CASH account not found.');
    });

    it('should throw error if transaction fails and abort the session', async () => {
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
        inTransaction: jest.fn().mockReturnValue(true),
      };
      mockAccountModel.db.startSession.mockReturnValue(sessionMock);
      mockAccountModel.findOne.mockRejectedValue(
        new Error('Transaction failed'),
      );
      mockUserModel.findById.mockResolvedValue({ isPinSet: true });
      mockCurrencyModel.findOne.mockResolvedValue({ code: 'NGN' });

      await expect(
        service.withdraw(
          mockRequest as CustomRequest,
          mockWithdrawDto,
          mockPin,
        ),
      ).rejects.toThrowError('Transaction failed');
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    // const mockTransferDto: TransferTransactionDto = {
    //   accountNumber: '1234567891',
    //   amount: 50,
    //   currency: 'NGN',
    //   description: 'Test transfer',
    // };
    // const mockPin = '1234';
  });
});
