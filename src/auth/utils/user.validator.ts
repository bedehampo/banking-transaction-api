import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { User } from '../schema/user.schema';
import { Account } from 'src/accounts/schema/account.schema';

@Injectable()
export class UserUtils {
  constructor(
    private readonly userModel: Model<User>,
    private readonly accountModel: Model<Account>,
  ) {}

  async numberExit(mobileNumber: string): Promise<void> {
    const doesUserExist = await this.userModel.findOne({ mobileNumber });
    if (doesUserExist) {
      throw new ConflictException('User already exists');
    }
  }

  async numberDoesNotExit(mobileNumber: string): Promise<User> {
    const user = await this.userModel.findOne({ mobileNumber });
    if (!user) {
      throw new UnauthorizedException('Account does not exists'); // Corrected to UnauthorizedException
    }

    return user;
  }

  async getUserById(id: Types.ObjectId) {
    const user = await this.userModel
      .findById(id)
      .populate({ path: 'accountId', select: 'accountNumber balance currency' })
      .select('-password -otp -otpExpiry -pin -isPinSet');
    if (!user) {
      throw new ConflictException('Account does not exists');
    }
    return user;
  }

  async validateUser(id: Types.ObjectId) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('account not found');
    if (user.status === 'suspended' || user.status === 'deleted') {
      throw new UnauthorizedException('unauthorised operator');
    }
  }
}
