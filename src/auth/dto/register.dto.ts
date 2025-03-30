import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Mike' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '07065890000' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}
