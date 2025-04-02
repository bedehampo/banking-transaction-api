/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { RegisterDto } from './dto/register.dto';
import { UserUtils } from './utils/user.validator';
import {
  generateOTP,
  validatePassword,
  verifyPassword,
} from 'src/common/utils/helper';
import * as argon2 from 'argon2';
import { Account } from 'src/accounts/schema/account.schema';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { PaginationDto } from './dto/pagination.dto';
import { SetTransactionPinDto } from './dto/transactionPin.dto';
import { IUser, IUsers } from 'src/common/interfaces/auth.interface';

@Injectable()
export class AuthService {
  private userUtils: UserUtils;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Account') private accountModel: Model<Account>,
    private jwtService: JwtService,
  ) {
    this.userUtils = new UserUtils(this.userModel, this.accountModel);
  }

  //Create account
  async createUser(dto: RegisterDto): Promise<{ msg: string; data: User }> {
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      const { firstName, lastName, mobileNumber, password } = dto;
      const formattedMobileNumber = `+234${mobileNumber.replace(/^0/, '')}`;
      const accountNumber = mobileNumber.replace(/^0/, '');

      // Check user existence
      await this.userUtils.numberExit(formattedMobileNumber);

      // Validate password
      await validatePassword(password);

      // Hash password
      const hashedPassword = await argon2.hash(password);

      // Create new user
      const newUser = await this.userModel.create(
        [
          {
            firstName,
            lastName,
            mobileNumber: formattedMobileNumber,
            password: hashedPassword,
          },
        ],
        { session },
      );

      const createdUser = newUser[0];
      if (!createdUser || !createdUser._id) {
        throw new InternalServerErrorException('User creation failed');
      }

      // Create account
      const newAccount = await this.accountModel.create(
        [
          {
            user: createdUser._id,
            accountNumber: accountNumber,
          },
        ],
        { session },
      );
      const createdAccount = newAccount[0];

      // Send OTP to user mobile number
      const { otp, otpExpiry } = generateOTP();

      // Update the user document with the OTP and expiry time
      await this.userModel.findByIdAndUpdate(
        createdUser._id,
        { otp, otpExpiry, accountId: createdAccount._id },
        { session },
      );

      await session.commitTransaction();

      // Transform in-memory to exclude password
      const userWithoutPassword = createdUser.toObject();
      delete userWithoutPassword.password;
      return {
        msg: 'User account successfully created',
        data: userWithoutPassword,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  //Login User
  async login(dto: LoginDto): Promise<{ msg: string; access_token: string }> {
    try {
      const { mobileNumber, password } = dto;
      const formattedMobileNumber = `+234${mobileNumber.replace(/^0/, '')}`;

      // Check user existence
      const user = await this.userUtils.numberDoesNotExit(
        formattedMobileNumber,
      );

      //  @ts-ignore
      await this.userUtils.validateUser(user._id);

      // verify user password
      await verifyPassword(user.password, password, 'password');

      const payload = { mobileNumber: user.mobileNumber, sub: user._id };

      return {
        msg: 'Login successfully',
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw error;
    }
  }

  //Get login user
  async getLoginUser(req: CustomRequest): Promise<{ msg: string; data: User }> {
    try {
      console.log(req);
      // Check user existence
      const user = await this.userUtils.getUserById(req.user._id);

      return {
        msg: 'Login user data retrieved successfully',
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  //Get users
  async getUsers(
    req: CustomRequest,
    dto: PaginationDto,
  ): Promise<{ msg: string; data: IUsers }> {
    try {
      await this.userUtils.validateUser(req.user._id);

      const { page, limit } = dto;

      const skip = (page - 1) * limit;

      const users = await this.userModel
        .find({
          _id: { $ne: req.user._id },
          status: { $in: ['unverified', 'verified'] },
        })
        .populate({ path: 'accountId', select: 'accountNumber' })
        .select('_id firstName lastName accountId')
        .limit(limit)
        .skip(skip);

      const totalCount = users.length;

      const totalPages = Math.ceil(totalCount / limit);

      const formattedUsers = users.map((user) => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        // @ts-ignore
        accountNumber: user.accountId ? user.accountId.accountNumber : null,
      }));

      const data = {
        users: formattedUsers,
        totalCount,
        totalPages,
        currentPage: page,
      };

      return {
        msg: 'Users retrieved successfully',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by id
  async getUserById(
    req: CustomRequest,
    id: string,
  ): Promise<{ msg: string; data: IUser }> {
    try {
      await this.userUtils.validateUser(req.user._id);

      const user = await this.userModel
        .findOne({
          _id: new Types.ObjectId(id),
          status: { $in: ['unverified', 'verified'] },
        })
        .populate({ path: 'accountId', select: 'accountNumber' })
        .select('_id firstName lastName accountId');

      if (!user) throw new NotFoundException('account does not exist');

      const formattedUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        // @ts-ignore
        accountNumber: user.accountId ? user.accountId.accountNumber : null,
      };

      return {
        msg: 'User retrieved successfully',
        data: formattedUser,
      };
    } catch (error) {
      throw error;
    }
  }

  // set transaction pin
  async setTransactionPin(
    req: CustomRequest,
    dto: SetTransactionPinDto,
  ): Promise<{ msg: string }> {
    try {
      //validate user
      const user = await this.userUtils.validateUser(req.user._id);

      // Extract data from payload
      const { pin, confirmPin } = dto;

      //verify
      if (pin !== confirmPin) throw new ConflictException('pin does not match');

      //verify if pin match
      const hashedPin = await argon2.hash(pin);

      await this.userModel.findByIdAndUpdate(
        {
          _id: user.id,
        },
        {
          pin: hashedPin,
          isPinSet: true,
        },
        { new: true },
      );

      return {
        msg: 'Transaction pin set successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}
