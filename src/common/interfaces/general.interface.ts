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
