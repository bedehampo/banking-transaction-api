import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserUtils } from './utils/user.validator';
import { User } from './schema/user.schema';
import { Account } from 'src/accounts/schema/account.schema';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateOTP, validatePassword } from 'src/common/utils/helper';
import { InternalServerErrorException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserModel = {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    db: {
      startSession: jest.fn(),
    },
  };
  const mockAccountModel = {
    create: jest.fn(),
  };
  const mockUserUtils = {
    numberExit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Account.name), useValue: mockAccountModel },
        { provide: UserUtils, useValue: mockUserUtils },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    mockUserModel.db.startSession.mockReturnValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
      inTransaction: jest.fn(),
    });
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '08012345678',
        password: 'password123',
      };
      const mockCreatedUser = {
        _id: 'user_id',
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '+2348012345678',
      };
      const mockCreatedAccount = {
        _id: 'account_id',
      };

      mockUserModel.create.mockResolvedValue([mockCreatedUser]);
      mockAccountModel.create.mockResolvedValue([mockCreatedAccount]);
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});
      mockUserUtils.numberExit.mockResolvedValue(undefined);
      (argon2.hash as jest.Mock) = jest
        .fn()
        .mockResolvedValue('hashed_password');
      (validatePassword as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (generateOTP as jest.Mock) = jest
        .fn()
        .mockReturnValue({ otp: '123456', otpExpiry: new Date() });

      const result = await authService.createUser(registerDto);

      expect(result).toBeDefined();
      expect(result.data).toEqual(mockCreatedUser);
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockAccountModel.create).toHaveBeenCalled();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '08012345678',
        password: 'password123',
      };

      mockUserModel.create.mockResolvedValue([]);
      mockUserUtils.numberExit.mockResolvedValue(undefined);
      (argon2.hash as jest.Mock) = jest
        .fn()
        .mockResolvedValue('hashed_password');
      (validatePassword as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (generateOTP as jest.Mock) = jest
        .fn()
        .mockReturnValue({ otp: '123456', otpExpiry: new Date() });

      await expect(authService.createUser(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw an error if numberExit fails', async () => {
      const registerDto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        mobileNumber: '08012345678',
        password: 'password123',
      };

      mockUserUtils.numberExit.mockRejectedValue(
        new Error('number exit error'),
      );
      (argon2.hash as jest.Mock) = jest
        .fn()
        .mockResolvedValue('hashed_password');
      (validatePassword as jest.Mock) = jest.fn().mockResolvedValue(undefined);
      (generateOTP as jest.Mock) = jest
        .fn()
        .mockReturnValue({ otp: '123456', otpExpiry: new Date() });

      await expect(authService.createUser(registerDto)).rejects.toThrow(
        'number exit error',
      );
    });
  });
});
