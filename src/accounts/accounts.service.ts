/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';
import { Account } from './schema/account.schema';
import { UserUtils } from 'src/auth/utils/user.validator';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { IAccountDetails } from 'src/common/interfaces/auth.interface';

@Injectable()
export class AccountsService {
  private readonly Bank_Name = process.env.BANK_NAME;
  private userUtils: UserUtils;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Account') private accountModel: Model<Account>,
    private jwtService: JwtService,
  ) {
    this.userUtils = new UserUtils(this.userModel, this.accountModel);
  }

  //get my account details
  async getAccountDetails(
    req: CustomRequest,
  ): Promise<{ msg: string; data: IAccountDetails }> {
    try {
      // validate user
      await this.userUtils.validateUser(req.user._id);

      const account = await this.accountModel
        .findOne({
          user: new Types.ObjectId(req.user._id),
        })
        .populate({ path: 'user', select: 'firstName lastName' })
        .select('_id accountNumber, balance currency');
      if (!account) throw new NotFoundException('account not found');
      // @ts-expect-error
      const customer_name = `${account.user.firstName} ${account.user.lastName}`;

      const data = {
        _id: account._id,
        userId: account.user._id,
        bank_name: this.Bank_Name,
        customer_name: customer_name,
        account_number: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
      };

      return {
        msg: 'Your account details retrieved successfully',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  // get user account details
  async getUserAccountDetails(
    req: CustomRequest,
    userId: string,
  ): Promise<{ msg: string; data: IAccountDetails }> {
    try {
      // Validate user
      await this.userUtils.validateUser(req.user._id);

      // validate user
      const newUserId = new Types.ObjectId(userId);
      await this.userUtils.validateUser(newUserId);

      const account = await this.accountModel
        .findOne({
          user: newUserId,
        })
        .populate({ path: 'user', select: 'firstName lastName' })
        .select('_id accountNumber, balance currency');
      if (!account) throw new NotFoundException('account not found');
      // @ts-expect-error
      const customer_name = `${account.user.firstName} ${account.user.lastName}`;

      const data = {
        _id: account._id,
        userId: account.user._id,
        bank_name: this.Bank_Name,
        customer_name: customer_name,
        account_number: account.accountNumber,
        currency: account.currency,
      };

      return {
        msg: 'User account details retrieved successfully',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }
}
