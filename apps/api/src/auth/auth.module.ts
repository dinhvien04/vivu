import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkAuthService } from './clerk-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, ClerkAuthService, JwtStrategy],
  exports: [AuthService, ClerkAuthService],
})
export class AuthModule {}
