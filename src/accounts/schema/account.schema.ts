import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Decimal128 } from 'mongodb';
import { Status } from 'src/common/enums/status.enums';

@Schema({ collection: 'Account', timestamps: true })
export class Account extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  accountNumber: string;

  @Prop({
    type: Decimal128,
    required: true,
    default: new Decimal128('0'),
  })
  balance: Decimal128;

  @Prop({ required: true, default: 'NGN' })
  currency: string;

  @Prop({
    type: String,
    enum: Status,
    default: Status.VERIFIED,
  })
  status: Status;

  @Prop({ ref: 'Transaction', type: [Types.ObjectId] })
  transactions: Types.ObjectId[];
}

export const AccountSchema = SchemaFactory.createForClass(Account);
