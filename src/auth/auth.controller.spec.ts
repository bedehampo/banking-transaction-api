/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Status } from 'src/common/enums/status.enums';
import { mockRequest } from '../../test/mocks/mock.request';
import {
  IGetUsersResponse,
  ILoginTest,
  IPaginationTest,
  IRegisterTest,
  ISetTransactionPinResponse,
  ITransactionTest,
} from '../common/interfaces/general.interface';
import { mockUsersResponse } from 'test/mocks/mock-user.response';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    createUser: jest.fn((dto) => {
      return {
        ...dto,
        isPinSet: false,
        status: Status.VERIFIED,
        _id: '112233445556777',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        __v: 0,
      };
    }),
    login: jest.fn((dto) => {
      return {
        access_token: '1234567890-asdfghjkl;xcvbnm,.dfghjklffdghjk',
      };
    }),
    getLoginUser: jest.fn((req: typeof mockRequest) => {
      return {
        _id: req.user._id,
        firstName: 'firstNameTest',
        lastName: 'lastNameTest',
        mobileNumber: req.user.mobileNumber,
        status: req.user.status,
        createdAt: '2025-03-31T08:24:57.801Z',
        updatedAt: '2025-03-31T09:23:16.641Z',
        __v: 0,
        accountId: {
          _id: '67ea515a76636b440f39a320',
          accountNumber: '7065896334',
          balance: {
            $numberDecimal: '37381995',
          },
          currency: 'NGN',
        },
      };
    }),
    getUsers: jest.fn(
      async (
        req: typeof mockRequest,
        dto: IPaginationTest,
      ): Promise<IGetUsersResponse> => {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: dto.page,
        };
      },
    ),
    getUserById: jest.fn(async (req: typeof mockRequest, userId: string) => {
      return {
        _id: userId,
        firstName: 'John',
        lastName: 'Doe',
        accountNumber: '7012345678',
      };
    }),
    setTransactionPin: jest.fn(
      async (
        req: typeof mockRequest,
        dto: ITransactionTest,
      ): Promise<{ msg: string }> => {
        return { msg: 'Transaction pin set successfully' };
      },
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  // Create user
  it('It should create a user', async () => {
    const dto: IRegisterTest = {
      firstName: 'TestUserFirstName',
      lastName: 'TestUserLastName',
      mobileNumber: '070testNumber',
      password: 'TestPassword',
    };

    const result = await controller.createAccount(dto);

    expect(result).toEqual({
      firstName: 'TestUserFirstName',
      lastName: 'TestUserLastName',
      mobileNumber: '070testNumber',
      password: 'TestPassword',
      isPinSet: false,
      status: Status.VERIFIED,
      _id: '112233445556777',
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
      __v: 0,
    });
  });

  // Login user
  it('It should login user', async () => {
    const dto: ILoginTest = {
      mobileNumber: '0705566777tes',
      password: 'TestPassword',
    };

    const result = await controller.login(dto);

    expect(result).toEqual({
      access_token: '1234567890-asdfghjkl;xcvbnm,.dfghjklffdghjk',
    });
  });

  // Get Login User
  it('It should get login user', async () => {
    const result = await controller.getLoginUser(mockRequest);
    expect(result).toEqual({
      _id: mockRequest.user._id,
      firstName: 'firstNameTest',
      lastName: 'lastNameTest',
      mobileNumber: mockRequest.user.mobileNumber,
      status: mockRequest.user.status,
      createdAt: '2025-03-31T08:24:57.801Z',
      updatedAt: '2025-03-31T09:23:16.641Z',
      __v: 0,
      accountId: {
        _id: '67ea515a76636b440f39a320',
        accountNumber: '7065896334',
        balance: {
          $numberDecimal: '37381995',
        },
        currency: 'NGN',
      },
    });
  });

  // Get Users
  it('It should get users with pagination (empty list)', async () => {
    const dto: IPaginationTest = {
      page: 1,
      limit: 10,
    };

    const mockResponse: IGetUsersResponse = {
      data: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };

    mockAuthService.getUsers.mockResolvedValue(mockResponse);
    const result = await controller.getUsers(mockRequest, dto);

    expect(result).toEqual(mockResponse);
  });

  // Get user by ID
  it('It should get user by ID', async () => {
    const userId = '112233445556777';

    const mockResponse = {
      _id: userId,
      firstName: 'John',
      lastName: 'Doe',
      accountNumber: '7012345678',
    };

    mockAuthService.getUserById.mockResolvedValueOnce(mockResponse);

    const result = await controller.getUser(mockRequest, userId);

    expect(result).toEqual(mockResponse);
  });

  // Set Transaction PIN
  it('It should set transaction PIN', async () => {
    const dto: ITransactionTest = {
      pin: '1234',
      confirmPin: '1234',
      confirmPinMatch: () => dto.confirmPin === dto.pin,
    };

    const mockResponse = { msg: 'Transaction pin set successfully' };

    mockAuthService.setTransactionPin.mockResolvedValueOnce(mockResponse);
    const result = await controller.setPin(mockRequest, dto);
    expect(result).toEqual(mockResponse);
  });
});
