import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SuggestQueryDto } from './suggest.query.dto';

async function run(input: Record<string, unknown>) {
  const dto = plainToInstance(SuggestQueryDto, input);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('SuggestQueryDto validation', () => {
  it('accepts a 2-char query and undefined limit', async () => {
    const { errors } = await run({ q: 'Hạ' });
    expect(errors).toHaveLength(0);
  });

  it('accepts a long query with a valid limit', async () => {
    const { errors, dto } = await run({ q: 'Vịnh Hạ Long', limit: '15' });
    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(15);
  });

  it('rejects a 1-char query (below minLength)', async () => {
    const { errors } = await run({ q: 'a' });
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.join(' ')).toMatch(/minLength|longer/i);
  });

  it('rejects a missing q', async () => {
    const { errors } = await run({});
    expect(errors.some((e) => e.property === 'q')).toBe(true);
  });

  it('rejects non-string q', async () => {
    const { errors } = await run({ q: 123 });
    expect(errors.some((e) => e.property === 'q')).toBe(true);
  });

  it('rejects limit < 1', async () => {
    const { errors } = await run({ q: 'Sài', limit: '0' });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('rejects limit > 20', async () => {
    const { errors } = await run({ q: 'Sài', limit: '21' });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('transforms a numeric-string limit into a number', async () => {
    const { dto, errors } = await run({ q: 'Sài', limit: '8' });
    expect(errors).toHaveLength(0);
    expect(typeof dto.limit).toBe('number');
  });

  it('rejects a non-integer limit', async () => {
    const { errors } = await run({ q: 'Sài', limit: '3.5' });
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });
});
