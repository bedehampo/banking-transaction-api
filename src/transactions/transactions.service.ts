import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account } from 'src/accounts/schema/account.schema';
import { User } from 'src/auth/schema/user.schema';
import { UserUtils } from 'src/auth/utils/user.validator';
import { Transaction } from './schema/transaction.schema';
import { CurrencySymbol } from './schema/currency.schema';
import * as currencyCode from 'currency-codes';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { ICurrency } from 'src/common/interfaces/general.interface';
import { CurrencyService } from './currency.service';
import { convertCurrency } from 'src/common/utils/helper';
import { DepositTransactionDto } from './dto/deposit-transaction.dto';
import { Status, TransactionTypeStatus } from 'src/common/enums/status.enums';
import { Decimal128, ObjectId } from 'mongodb';
import { TransactionUtils } from './utils/transaction.utils';
import { WithdrawTransactionDto } from './dto/withdrawal-transaction.dto';
import { TransferTransactionDto } from './dto/transfer-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private userUtils: UserUtils;
  private transactionUtils: TransactionUtils;
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Account') private accountModel: Model<Account>,
    @InjectModel('Transaction') private transactionModel: Model<Transaction>,
    @InjectModel('CurrencySymbol') private currencyModel: Model<CurrencySymbol>,
    private jwtService: JwtService,
    private readonly currencyService: CurrencyService,
  ) {
    this.userUtils = new UserUtils(this.userModel, this.accountModel);
    this.transactionUtils = new TransactionUtils(this.currencyModel);
  }

  // populate the currency record with currency info
  async saveCurrencyInfo(): Promise<void> {
    try {
      const existingCurrencies = await this.currencyModel
        .find({}, { code: 1 })
        .lean();
      const existingCodes = new Set(existingCurrencies.map((cur) => cur.code));

      const currenciesToInsert = currencyCode.data
        .filter((currency) => !existingCodes.has(currency.code))
        .map((currency) => ({
          code: currency.code,
          number: Number(currency.number),
          digit: currency.digits,
          currency: currency.currency,
          countries: currency.countries,
        }));

      if (currenciesToInsert.length > 0) {
        await this.currencyModel.insertMany(currenciesToInsert);
        console.log(`${currenciesToInsert.length} new currencies saved.`);
      } else {
        console.log('No new currencies to insert.');
      }
    } catch (error) {
      console.error('Error saving currency info:', error);
      throw error;
    }
  }

  // Get currency
  async getCurrencies(
    req: CustomRequest,
    search?: string,
  ): Promise<{ msg: string; data: ICurrency[] }> {
    try {
      // validate user
      await this.userUtils.validateUser(req.user._id);

      // Build query condition
      const query: any = {};
      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { currency: { $regex: search, $options: 'i' } },
        ];
      }

      // Fetch response
      const currencies = await this.currencyModel
        .find(query)
        .select('-countries -createdAt -updatedAt -digit -number -__v');

      return {
        msg: 'Currencies retrieve successfully',
        data: currencies as ICurrency[],
      };
    } catch (error) {
      throw error;
    }
  }

  // Deposit
  async deposit(dto: DepositTransactionDto) {
    const session = await this.accountModel.db.startSession();
    session.startTransaction();
    try {
      // Extracting data from payload
      const {
        accountNumber,
        amount,
        currency,
        description,
        depositorFirstName,
        depositorLastName,
      } = dto;

      // deposit value
      let depositValue;

      // validate currency type
      await this.transactionUtils.validateCurrencyCode(currency);

      if (currency !== 'NGN') {
        depositValue = await convertCurrency(currency, 'NGN', amount);
      }

      // Convert amount to Decimal128 for MongoDB
      const amountDecimal = Decimal128.fromString(depositValue.toString());
      // transaction amount
      const transactionAmount = Decimal128.fromString(amount.toString());

      // Check if account exists and update balance
      const account = await this.accountModel
        .findOneAndUpdate(
          { accountNumber: accountNumber, status: Status.VERIFIED },
          { $inc: { balance: amountDecimal }, $set: { updatedAt: new Date() } },
          { new: true, session },
        )
        .exec();

      if (!account) {
        throw new NotFoundException(
          `Account with number ${accountNumber} not found`,
        );
      }

      // Create transaction record
      const transaction = await this.transactionModel.create(
        [
          {
            depositorFirstName: depositorFirstName,
            depositorLastName: depositorLastName,
            amount: transactionAmount,
            type: TransactionTypeStatus.DEPOSIT,
            currency: currency,
            description: description,
            destinationAccountId: account._id,
            credit: true,
          },
        ],
        { session },
      );

      account.transactions.push(transaction[0]._id as ObjectId);
      await account.save();

      await session.commitTransaction();

      return {
        msg: 'Deposit initiated successful',
        data: transaction[0],
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  // withdrawal
  async withdraw(req: CustomRequest, dto: WithdrawTransactionDto) {
    const session = await this.accountModel.db.startSession();
    session.startTransaction();

    try {
      // Validate user
      const user = await this.userUtils.validateUser(req.user._id);

      // Extract data from payload
      const { amount, currency, description } = dto;

      await this.transactionUtils.validateCurrencyCode(currency);

      let withdrawAmountNGN = amount;

      if (currency !== 'NGN') {
        withdrawAmountNGN = await convertCurrency(currency, 'NGN', amount);
      }

      const amountDecimal = Decimal128.fromString(withdrawAmountNGN.toString());
      const transactionAmount = Decimal128.fromString(amount.toString());

      const account = await this.accountModel
        .findOne({
          user: user._id,
          status: Status.VERIFIED,
        })
        .exec();

      if (!account) throw new NotFoundException('account not found');

      // sufficient funds check
      if (
        Number(account.balance.toString()) < Number(amountDecimal.toString())
      ) {
        throw new BadRequestException('Insufficient funds');
      }

      // balance update
      account.balance = Decimal128.fromString(
        (
          Number(account.balance.toString()) - Number(amountDecimal.toString())
        ).toString(),
      );

      await account.save({ session });

      const transaction = await this.transactionModel.create(
        [
          {
            amount: transactionAmount,
            type: TransactionTypeStatus.WITHDRAWAL,
            currency,
            description,
            credit: false,
          },
        ],
        { session },
      );

      account.transactions.push(transaction[0]._id as ObjectId);
      await account.save({ session });

      await session.commitTransaction();

      return {
        msg: 'Withdrawal initiated successfully',
        data: transaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // transfer
  async transfer(req: CustomRequest, dto: TransferTransactionDto) {
    const session = await this.accountModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userUtils.validateUser(req.user._id);
      const { accountNumber, amount, currency, description } = dto;

      await this.transactionUtils.validateCurrencyCode(currency);

      let transferAmountNGN = amount;

      if (currency !== 'NGN') {
        transferAmountNGN = await convertCurrency(currency, 'NGN', amount);
      }

      const amountDecimal = Decimal128.fromString(transferAmountNGN.toString());
      const transactionAmount = Decimal128.fromString(amount.toString());

      // Find sender's account
      const senderAccount = await this.accountModel
        .findOne({
          user: user._id,
          status: Status.VERIFIED,
        })
        .exec();

      if (!senderAccount)
        throw new NotFoundException('Sender account not found');

      // Find recipient's account
      const recipientAccount = await this.accountModel
        .findOne({
          accountNumber: accountNumber,
          status: Status.VERIFIED,
        })
        .exec();

      if (!recipientAccount)
        throw new NotFoundException('Recipient account not found');

      // Check for sufficient funds
      if (
        Number(senderAccount.balance.toString()) <
        Number(amountDecimal.toString())
      ) {
        throw new BadRequestException('Insufficient funds');
      }

      // Update sender's balance
      senderAccount.balance = Decimal128.fromString(
        (
          Number(senderAccount.balance.toString()) -
          Number(amountDecimal.toString())
        ).toString(),
      );
      await senderAccount.save({ session });

      // Update recipient's balance
      recipientAccount.balance = Decimal128.fromString(
        (
          Number(recipientAccount.balance.toString()) +
          Number(amountDecimal.toString())
        ).toString(),
      );
      await recipientAccount.save({ session });

      // Create transaction records
      const transactions = await this.transactionModel.create(
        [
          {
            amount: transactionAmount,
            type: TransactionTypeStatus.TRANSFER,
            currency,
            description: description,
            credit: false,
            destinationAccountId: recipientAccount._id,
          },
          {
            depositorFirstName: user.firstName,
            depositorLastName: user.lastName,
            amount: transactionAmount,
            type: TransactionTypeStatus.TRANSFER,
            currency,
            description: description,
            credit: true,
            senderAccountId: senderAccount._id,
          },
        ],
        { session, ordered: true },
      );

      senderAccount.transactions.push(transactions[0]._id as ObjectId);
      await senderAccount.save({ session });
      recipientAccount.transactions.push(transactions[1]._id as ObjectId);
      await recipientAccount.save({ session });

      await session.commitTransaction();

      return {
        msg: 'Transfer initiated successfully',
        data: transactions[0],
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  @Cron(CronExpression.EVERY_SECOND)
  async handleCronMinutes() {
    // this.logger.log('Cron job executed every second');
    // await this.saveCurrencyInfo();
  }
}
