import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Decimal128 } from 'mongodb';
import { TransactionTypeStatus } from 'src/common/enums/status.enums';

@Schema({ collection: 'Transaction', timestamps: true })
export class Transaction extends Document {
  @Prop({ default: null })
  depositorFirstName: string;

  @Prop({ default: null })
  depositorLastName: string;

  @Prop({
    type: Decimal128,
    required: true,
    default: new Decimal128('0'),
  })
  amount: Decimal128;

  @Prop({ required: true, enum: TransactionTypeStatus })
  type: TransactionTypeStatus;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  senderAccountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', default: null })
  destinationAccountId: Types.ObjectId;

  @Prop({ required: true })
  credit: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
