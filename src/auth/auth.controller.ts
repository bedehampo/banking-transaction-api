import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CustomRequest } from 'src/common/interfaces/custom-request';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from './dto/pagination.dto';
import { SetTransactionPinDto } from './dto/transactionPin.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // create user account
  @Post('create-account')
  async createAccount(@Body() dto: RegisterDto) {
    return this.authService.createUser(dto);
  }

  //Login user
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Get login user
  @Get('get-login-user')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async getLoginUser(@Req() req: CustomRequest) {
    return this.authService.getLoginUser(req);
  }

  // Get users
  @Get('get-users')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async getUsers(@Req() req: CustomRequest, @Query() dto: PaginationDto) {
    return this.authService.getUsers(req, dto);
  }

  // Get user by id
  @Get('get-user/:id')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Req() req: CustomRequest, @Param('id') id: string) {
    return this.authService.getUserById(req, id);
  }

  // Set Transaction Pin
  @Post('set-pin')
  @ApiBearerAuth('jwt')
  @UseGuards(AuthGuard('jwt'))
  async setPin(@Req() req: CustomRequest, @Body() dto: SetTransactionPinDto) {
    return this.authService.setTransactionPin(req, dto);
  }
}
