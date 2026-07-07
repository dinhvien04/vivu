import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { assertGoogleOAuthEnvConsistency, isGoogleOAuthConfigured } from './google-oauth.config';
import { GoogleOAuthEnabledGuard } from './guards/google-oauth-enabled.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { OAuthStateService } from './oauth-state.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

assertGoogleOAuthEnvConsistency();

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OAuthStateService,
    JwtStrategy,
    OptionalJwtAuthGuard,
    GoogleOAuthEnabledGuard,
    ...(isGoogleOAuthConfigured() ? [GoogleStrategy] : []),
  ],
  exports: [AuthService, OptionalJwtAuthGuard],
})
export class AuthModule {}
