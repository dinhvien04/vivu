import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Tên cần tối thiểu 2 ký tự' })
  @MaxLength(80)
  name!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu cần tối thiểu 8 ký tự' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu cần có ít nhất 1 chữ và 1 số',
  })
  password!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(160)
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(160)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu cần tối thiểu 8 ký tự' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu cần có ít nhất 1 chữ và 1 số',
  })
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên cần tối thiểu 2 ký tự' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Giới thiệu tối đa 500 ký tự' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'URL ảnh không hợp lệ' })
  @MaxLength(500)
  avatarUrl?: string;
}

export class DeleteAccountDto {
  @IsString()
  @MaxLength(128)
  password!: string;
}
