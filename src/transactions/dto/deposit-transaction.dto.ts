import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class DepositTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  depositorFirstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  depositorLastName: string;

  @ApiProperty({ example: '7011223344' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: '100' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'NGN' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
