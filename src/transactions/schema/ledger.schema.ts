import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Decimal128 } from 'mongodb';

@Schema({ timestamps: true })
export class LedgerEntry extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Transaction',
    required: true,
    index: true,
  })
  transactionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  accountId: Types.ObjectId;

  @Prop({
    type: Decimal128,
    required: true,
    default: new Decimal128('0'),
  })
  amount: Decimal128;

  @Prop({ enum: ['debit', 'credit'], required: true, index: true })
  type: 'debit' | 'credit';

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  currency: string;
}

export const LedgerEntrySchema = SchemaFactory.createForClass(LedgerEntry);
