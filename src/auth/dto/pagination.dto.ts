import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiProperty({ default: 10, description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;
}
