import { Module } from '@nestjs/common';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { TripPlannerQuotaService } from './trip-planner-quota.service';
import { TripPlansController } from './trip-plans.controller';
import { TripPlansService } from './trip-plans.service';

@Module({
  imports: [AiProvidersModule],
  controllers: [TripPlansController],
  providers: [TripPlansService, TripPlannerQuotaService],
  exports: [TripPlansService],
})
export class TripPlansModule {}
