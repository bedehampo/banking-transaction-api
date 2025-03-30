import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'Account', timestamps: true })
export class Account extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true, unique: true })
  accountNumber: string;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: 'NGN' })
  currency: string;

  @Prop({ ref: 'Transaction', type: [Types.ObjectId] })
  transactions: Types.ObjectId[];
}

export const AccountSchema = SchemaFactory.createForClass(Account);
