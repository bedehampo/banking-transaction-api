import { Model } from 'mongoose';
import { CurrencySymbol } from '../schema/currency.schema';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TransactionUtils {
  constructor(private readonly currencyModel: Model<CurrencySymbol>) {}

  async validateCurrencyCode(code: string) {
    try {
      const validateCode = await this.currencyModel.findOne({
        code: code,
      });
      if (!validateCode) throw new NotFoundException('invalid currency code');
      return true;
    } catch (error) {
      throw error;
    }
  }
}
