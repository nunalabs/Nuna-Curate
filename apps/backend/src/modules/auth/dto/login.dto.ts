import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Stellar public key',
    example: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'Signed message for authentication',
    example: 'signed_message_here',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Original message that was signed',
    example: 'Login to Nuna Curate - Timestamp: 1234567890',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
