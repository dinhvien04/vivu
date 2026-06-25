import { ServiceUnavailableException } from '@nestjs/common';
import { TripPlansController } from './trip-plans.controller';
import type { GenerateTripPlanDto } from './dto/generate-trip-plan.dto';

describe('TripPlansController production hardening', () => {
  const originalTripPlannerFeatureEnabled = process.env.TRIP_PLANNER_FEATURE_ENABLED;

  afterEach(() => {
    if (originalTripPlannerFeatureEnabled === undefined) {
      delete process.env.TRIP_PLANNER_FEATURE_ENABLED;
    } else {
      process.env.TRIP_PLANNER_FEATURE_ENABLED = originalTripPlannerFeatureEnabled;
    }
  });

  it('returns 503 when the trip planner kill switch is disabled', () => {
    process.env.TRIP_PLANNER_FEATURE_ENABLED = 'false';
    const tripPlans = { generate: jest.fn() };
    const controller = new TripPlansController(tripPlans as never, {} as never);

    expect(() => controller.generate(validDto(), {} as never)).toThrow(
      ServiceUnavailableException,
    );
    expect(tripPlans.generate).not.toHaveBeenCalled();
  });
});

function validDto(): GenerateTripPlanDto {
  return {
    area: 'all',
    days: 2,
    peopleCount: 2,
    transport: 'xe_may',
    interests: ['bien-dao'],
    budget: 'vua phai',
    note: 'di nhe nhang',
    locale: 'vi',
  };
}
