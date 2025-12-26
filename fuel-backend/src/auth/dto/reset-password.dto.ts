import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string; // formato id.secret

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
