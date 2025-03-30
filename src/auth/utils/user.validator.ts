import { Model } from 'mongoose';
import { User } from '../schema/user.schema';
import { ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';

export class UserUtils {
  constructor(private readonly userModel: Model<User>) {}

  async numberExit(mobileNumber: string): Promise<void> {
    const doesUserExist = await this.userModel.findOne({ mobileNumber });
    if (doesUserExist) {
      throw new ConflictException('User already exists');
    }
  }

  async numberDoesNotExit(mobileNumber: string): Promise<User> {
    const user = await this.userModel.findOne({ mobileNumber });
    if (!user) {
      throw new ConflictException('Account does not exists');
    }

    return user;
  }

  async getUserById(id: Types.ObjectId) {
    console.log(id);
    const user = await this.userModel
      .findById(id)
      .select('-password -otp -otpExpiry -pin -isPinSet');
    if (!user) {
      throw new ConflictException('Account does not exists');
    }
    return user;
  }
}
