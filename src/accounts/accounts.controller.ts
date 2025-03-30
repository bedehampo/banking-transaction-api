import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomRequest } from 'src/common/interfaces/custom-request';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // Get account details
  @Get('get-my-account-details')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async getMyAccountDetails(@Req() req: CustomRequest) {
    return this.accountsService.getAccountDetails(req);
  }

  // Get user account details
  @Get('get-user-account-details/:userId')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async getUserAccountDetails(
    @Req() req: CustomRequest,
    @Param('userId') userId: string,
  ) {
    return this.accountsService.getUserAccountDetails(req, userId);
  }
}
