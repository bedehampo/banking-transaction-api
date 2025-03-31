import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/auth/schema/user.schema';
import { Account, AccountSchema } from 'src/accounts/schema/account.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transaction, TransactionSchema } from './schema/transaction.schema';
import { CurrencySymbol, CurrencySymbolSchema } from './schema/currency.schema';
import { CurrencyService } from './currency.service';
import { LedgerEntry, LedgerEntrySchema } from './schema/ledger.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: CurrencySymbol.name, schema: CurrencySymbolSchema },
      { name: LedgerEntry.name, schema: LedgerEntrySchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, CurrencyService],
})
export class TransactionsModule {}
