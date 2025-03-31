import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, ValidateIf } from 'class-validator';

export class SetTransactionPinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'PIN must be a 6-digit number' })
  pin: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Confirm PIN must be a 6-digit number' })
  confirmPin: string;

  @ValidateIf((object, value) => object.pin !== value, {
    message: 'PIN and Confirm PIN must match',
  })
  confirmPinMatch(): boolean {
    return true;
  }
}
