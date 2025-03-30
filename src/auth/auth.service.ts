import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class AuthService {
  private userUtils: UserUtils;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Account') private accountModel: Model<Account>,
    private jwtService: JwtService,
  ) {
    this.userUtils = new UserUtils(this.userModel);
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
      return {
        msg: 'User account successfully created',
        data: createdUser,
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

      // verify user password
      await verifyPassword(user.password, password);

      const payload = { email: user.mobileNumber, sub: user._id };

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
      console.log('Req', req.user._id);
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
}
