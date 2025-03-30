import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'User', timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  mobileNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  otp: string;

  @Prop()
  otpExpiry: Date;

  @Prop()
  pin: string;

  @Prop({ default: false })
  isPinSet: boolean;

  @Prop({
    enum: ['unverified', 'verified', 'suspended', 'deleted'],
    default: 'unverified',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  accountId: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
