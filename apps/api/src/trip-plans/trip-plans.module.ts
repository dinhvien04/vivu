import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { TripPlannerQuotaService } from './trip-planner-quota.service';
import { TripPlansController } from './trip-plans.controller';
import { TripPlansService } from './trip-plans.service';

@Module({
  imports: [GeminiModule],
  controllers: [TripPlansController],
  providers: [TripPlansService, TripPlannerQuotaService],
  exports: [TripPlansService],
})
export class TripPlansModule {}
