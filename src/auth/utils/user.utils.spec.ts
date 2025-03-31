import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schema/user.schema';
import { Account } from 'src/accounts/schema/account.schema';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserUtils } from './user.validator';

describe('UserUtils', () => {
  let userUtils: UserUtils;
  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
  };
  const mockAccountModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUtils,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Account.name), useValue: mockAccountModel },
      ],
    }).compile();

    userUtils = module.get<UserUtils>(UserUtils);
  });

  it('should be defined', () => {
    expect(userUtils).toBeDefined();
  });

  describe('numberExit', () => {
    it('should not throw an error if number does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(userUtils.numberExit('08012345678')).resolves.not.toThrow();
    });

    it('should throw ConflictException if number exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ mobileNumber: '08012345678' });
      await expect(userUtils.numberExit('08012345678')).rejects.toThrow(
        ConflictException,
      );
      await expect(userUtils.numberExit('08012345678')).rejects.toThrow(
        'User already exists',
      );
    });
  });

  describe('numberDoesNotExit', () => {
    it('should return the user if number exists', async () => {
      const mockUser = { mobileNumber: '08012345678' };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const result = await userUtils.numberDoesNotExit('08012345678');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if number does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      await expect(userUtils.numberDoesNotExit('08012345678')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(userUtils.numberDoesNotExit('08012345678')).rejects.toThrow(
        'Account does not exists',
      );
    });
  });

  describe('getUserById', () => {
    it('should return the user if found', async () => {
      const mockUser = {
        _id: new Types.ObjectId(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({}),
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      const result = await userUtils.getUserById(new Types.ObjectId());
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if user is not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(userUtils.getUserById(new Types.ObjectId())).rejects.toThrow(
        ConflictException,
      );
      await expect(userUtils.getUserById(new Types.ObjectId())).rejects.toThrow(
        'Account does not exists',
      );
    });
  });

  describe('validateUser', () => {
    it('should return the user if found and active', async () => {
      const mockUser = { _id: new Types.ObjectId(), status: 'active' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      const result = await userUtils.validateUser(new Types.ObjectId());
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow(NotFoundException);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow('account not found');
    });

    it('should throw UnauthorizedException if user is suspended', async () => {
      const mockUser = { _id: new Types.ObjectId(), status: 'suspended' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow('unauthorised operator');
    });

    it('should throw UnauthorizedException if user is deleted', async () => {
      const mockUser = { _id: new Types.ObjectId(), status: 'deleted' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        userUtils.validateUser(new Types.ObjectId()),
      ).rejects.toThrow('unauthorised operator');
    });
  });
});
