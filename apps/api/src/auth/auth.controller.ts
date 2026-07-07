import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Redirect,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { OAuthStateService } from './oauth-state.service';
import { TurnstileService } from '../common/turnstile.service';
import {
  ChangePasswordDto,
  DeleteAccountDto,
  ExchangeOAuthDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

const AUTH_RATE_LIMIT_PER_15_MIN = positiveInteger(process.env.AUTH_RATE_LIMIT_PER_15_MIN, 20);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly turnstile: TurnstileService,
    private readonly oauthState: OAuthStateService,
  ) {}

  @Public()
  @Get('google')
  @Redirect('https://accounts.google.com', 302)
  async googleAuth(@Req() req: FastifyRequest) {
    const { next, origin } = req.query as { next?: string; origin?: string };
    const state = await this.oauthState.createState(next, origin);

    const clientID = process.env.GOOGLE_CLIENT_ID;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !callbackURL) {
      throw new Error('Google OAuth configuration is missing in API environment variables');
    }

    const googleUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code` +
      `&client_id=${encodeURIComponent(clientID)}` +
      `&redirect_uri=${encodeURIComponent(callbackURL)}` +
      `&scope=${encodeURIComponent('email profile')}` +
      `&state=${encodeURIComponent(state)}`;

    return { url: googleUrl };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect('http://localhost:3000', 302)
  async googleAuthRedirect(@Req() req: any) {
    const profile = req.user;
    if (!profile?.email) {
      throw new UnauthorizedException('Không thể xác thực tài khoản Google');
    }

    const verified = await this.oauthState.verifyAndConsumeState(req.query?.state);
    const next = verified.next;
    const finalOrigin = verified.origin;

    const { tokens } = await this.auth.loginOrRegisterOAuth(
      {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      req,
    );

    const code = await this.auth.createOAuthExchangeCode(tokens);
    const redirectUrl = `${finalOrigin}/api/auth/google/callback?code=${encodeURIComponent(
      code,
    )}&next=${encodeURIComponent(next)}`;

    return { url: redirectUrl };
  }

  @Public()
  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  exchangeOAuth(@Body() dto: ExchangeOAuthDto) {
    return this.auth.exchangeOAuthCode(dto.code);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 900_000, limit: AUTH_RATE_LIMIT_PER_15_MIN } })
  async register(@Body() dto: RegisterDto, @Req() request: FastifyRequest) {
    await this.turnstile.verify(dto.turnstileToken, request);
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: AUTH_RATE_LIMIT_PER_15_MIN } })
  login(@Body() dto: LoginDto, @Req() request: FastifyRequest) {
    return this.auth.login(dto, request);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  refresh(@Body() dto: RefreshDto, @Req() request: FastifyRequest) {
    return this.auth.refresh(dto.refreshToken, request);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: FastifyRequest,
  ): Promise<void> {
    await this.turnstile.verify(dto.turnstileToken, request);
    await this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  @ApiBearerAuth()
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth()
  async updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  @ApiBearerAuth()
  async getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getStats(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.auth.deleteAccount(user.id, dto.password);
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
