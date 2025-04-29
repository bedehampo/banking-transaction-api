import { Model } from 'mongoose';
import { User } from '../schema/user.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserUtils {
  constructor(private readonly userModel: Model<User>) {}
}
