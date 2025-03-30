import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'Transaction', timestamps: true })
export class Transaction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['deposit', 'withdrawal', 'transfer'] })
  type: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  senderAccountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  destinationAccountId: Types.ObjectId;

  @Prop({ required: true })
  credit: boolean;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
