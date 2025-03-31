import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionTypeStatus } from 'src/common/enums/status.enums';

export class GetTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionTypeStatus })
  @IsOptional()
  @IsEnum(TransactionTypeStatus)
  type?: TransactionTypeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
