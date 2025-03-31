import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'CurrencySymbol', timestamps: true })
export class CurrencySymbol extends Document {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  digit: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  countries: [string];
}

export const CurrencySymbolSchema =
  SchemaFactory.createForClass(CurrencySymbol);
