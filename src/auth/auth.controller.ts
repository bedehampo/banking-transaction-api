import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CustomRequest } from 'src/common/interfaces/custom-request';

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
  async getLoginUser(@Req() req: CustomRequest) {
    return this.authService.getLoginUser(req);
  }
}
