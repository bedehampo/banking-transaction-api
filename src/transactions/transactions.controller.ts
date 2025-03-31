import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { DepositTransactionDto } from './dto/deposit-transaction.dto';
import { WithdrawTransactionDto } from './dto/withdrawal-transaction.dto';
import { TransferTransactionDto } from './dto/transfer-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Get currencies
  @Get('get-currencies')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by currency code or name',
  })
  async getCurrencies(
    @Req() req: CustomRequest,
    @Query('search') search?: string,
  ) {
    return this.transactionsService.getCurrencies(req, search);
  }

  // Deposit
  @Post('deposit')
  @ApiOperation({ summary: 'Make a deposit to an account' })
  @ApiBody({ type: DepositTransactionDto })
  async deposit(@Body() dto: DepositTransactionDto) {
    return this.transactionsService.deposit(dto);
  }

  // Withdraw
  @Post('withdraw')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'withdraw from your account' })
  @ApiBody({ type: WithdrawTransactionDto })
  async withdraw(
    @Req() req: CustomRequest,
    @Body() dto: WithdrawTransactionDto,
  ) {
    return this.transactionsService.withdraw(req, dto);
  }

  // transfer
  @Post('transfer')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'transfer to user account' })
  @ApiBody({ type: TransferTransactionDto })
  async transfer(
    @Req() req: CustomRequest,
    @Body() dto: TransferTransactionDto,
  ) {
    return this.transactionsService.transfer(req, dto);
  }
}
