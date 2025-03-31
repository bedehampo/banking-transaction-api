import { Types } from 'mongoose';
import { Decimal128 } from 'mongodb';

export interface IUser {
  _id: unknown;
  firstName: string;
  lastName: string;
  accountNumber: string;
}

export interface IUsers {
  users: IUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export interface IAccountDetails {
  _id: unknown;
  userId: Types.ObjectId;
  bank_name: string;
  customer_name: string;
  account_number: string;
  balance?: Decimal128;
  currency: string;
}
