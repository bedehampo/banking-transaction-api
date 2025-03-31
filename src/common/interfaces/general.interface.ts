import { Decimal128 } from 'mongodb';
import { Types } from 'mongoose';
export interface ICurrency {
  _id: string;
  code: string;
  currency: string;
}

export interface ICurrencyConverter {
  from(currency: string): this;
  to(currency: string): this;
  amount(value: number): this;
  isDecimalComma(value: boolean): this;
  convert(): Promise<number>;
  rates(): Promise<number>;
  setupRatesCache(options: {
    isRatesCaching: boolean;
    ratesCacheDuration?: number;
  }): this;
}

export interface ITransaction {
  depositorFirstName: string | null;
  depositorLastName: string | null;
  amount: Decimal128;
  type: 'deposit' | 'withdrawal' | string;
  currency: string;
  description: string;
  senderAccountId: Types.ObjectId | null;
  destinationAccountId: Types.ObjectId | null;
  credit: boolean;
  _id: unknown;
  __v: number;
}

export interface IPaginateTransaction {
  transactions: ITransaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
