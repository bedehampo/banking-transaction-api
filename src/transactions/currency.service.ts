import { Injectable, Logger } from '@nestjs/common';
import * as CurrencyConverterLT from 'currency-converter-lt';

interface CurrencyConverter {
  from(currency: string): this;
  to(currency: string): this;
  amount(value: number): this;
  convert(): Promise<number>;
  rates(): Promise<number>;
  setupRatesCache(options: {
    isRatesCaching: boolean;
    ratesCacheDuration?: number;
  }): this;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private currencyConverter: CurrencyConverter;

  constructor() {
    const CC = CurrencyConverterLT.default || CurrencyConverterLT;
    this.currencyConverter = new CC();
    // Set up rates caching
    const ratesCacheOptions = {
      isRatesCaching: true,
      ratesCacheDuration: 3600, // 1 hour
    };
    this.currencyConverter =
      this.currencyConverter.setupRatesCache(ratesCacheOptions);
  }

  async convertCurrency(
    from: string,
    to: string,
    amount: number,
    isDecimalComma = false,
  ): Promise<number> {
    try {
      const CC = CurrencyConverterLT.default || CurrencyConverterLT;
      const converter = new CC({ from, to, amount, isDecimalComma });
      console.log('Converter instance:', converter);
      const conversionResponse = await converter.convert();
      console.log('Raw conversion response:', conversionResponse);
      this.logger.log(
        `Converted ${amount} ${from} to ${to}: ${conversionResponse}`,
      );
      if (isNaN(conversionResponse)) {
        this.logger.warn(
          `Conversion resulted in NaN for ${amount} ${from} to ${to}`,
        );
      }
      return conversionResponse;
    } catch (error) {
      this.logger.error(`Error in currency conversion: ${error.message}`);
      throw error;
    }
  }

  async getConversionRates(from: string, to: string): Promise<number> {
    try {
      const ratesResponse = await this.currencyConverter
        .from(from)
        .to(to)
        .rates();
      this.logger.log(
        `Fetched conversion rates from ${from} to ${to}: ${ratesResponse}`,
      );
      return ratesResponse;
    } catch (error) {
      this.logger.error(`Error fetching conversion rates: ${error.message}`);
      throw error;
    }
  }
}
