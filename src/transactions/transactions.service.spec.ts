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
import { UnauthorizedException } from '@nestjs/common';

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
      // Mock service.userUtils.validateUser to throw UnauthorizedException
      jest
        .spyOn(service.userUtils, 'validateUser')
        .mockRejectedValue(new UnauthorizedException());

      const req: any = { user: { _id: new Types.ObjectId() } };

      await expect(service.getCurrencies(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
