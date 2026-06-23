import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GenerateTripPlanDto } from './generate-trip-plan.dto';

async function validateInput(input: Record<string, unknown>) {
  return validate(plainToInstance(GenerateTripPlanDto, input));
}

describe('GenerateTripPlanDto', () => {
  it('accepts the transport values supported by the backend', async () => {
    const errors = await validateInput({
      area: 'quy-nhon',
      days: 2,
      peopleCount: 4,
      transport: 'xe_may',
      interests: ['bien-dao', 'di-tich'],
      locale: 'vi',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects stale frontend transport values', async () => {
    const errors = await validateInput({
      area: 'quy-nhon',
      days: 2,
      peopleCount: 4,
      transport: 'car',
      interests: ['bien-dao'],
      locale: 'vi',
    });

    expect(errors.some((error) => error.property === 'transport')).toBe(true);
  });

  it('keeps itinerary size bounded', async () => {
    const errors = await validateInput({
      area: 'all',
      days: 9,
      peopleCount: 60,
      transport: 'oto',
      interests: Array.from({ length: 11 }, (_, index) => `interest-${index}`),
      locale: 'vi',
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['days', 'peopleCount', 'interests']),
    );
  });
});
