import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListPlacesQueryDto } from './list-places.query.dto';

async function run(input: Record<string, unknown>) {
  const dto = plainToInstance(ListPlacesQueryDto, input);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('ListPlacesQueryDto validation', () => {
  it.each([
    ['hasGeo', 'true', true],
    ['hasGeo', 'false', false],
    ['hasHeroImage', 'true', true],
    ['hasHeroImage', 'false', false],
    ['isAiReady', 'true', true],
    ['isAiReady', 'false', false],
  ] as const)('transforms %s=%s to %s', async (field, value, expected) => {
    const { dto, errors } = await run({ [field]: value });

    expect(errors).toHaveLength(0);
    expect(dto[field]).toBe(expected);
  });

  it.each(['hasGeo', 'hasHeroImage', 'isAiReady'] as const)(
    'rejects invalid %s values',
    async (field) => {
      const { errors } = await run({ [field]: 'invalid' });

      expect(errors.some((error) => error.property === field)).toBe(true);
    },
  );
});
