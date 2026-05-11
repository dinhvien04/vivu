import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListAuditLogsQueryDto } from './list-audit-logs.query.dto';

async function run(input: Record<string, unknown>) {
  const dto = plainToInstance(ListAuditLogsQueryDto, input);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('ListAuditLogsQueryDto validation', () => {
  it('accepts an empty payload (both fields optional)', async () => {
    const { errors } = await run({});
    expect(errors).toHaveLength(0);
  });

  it('accepts valid page + pageSize', async () => {
    const { dto, errors } = await run({ page: '2', pageSize: '50' });
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('rejects page < 1', async () => {
    const { errors } = await run({ page: '0' });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects pageSize < 1', async () => {
    const { errors } = await run({ pageSize: '0' });
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects pageSize > 100 (max)', async () => {
    const { errors } = await run({ pageSize: '101' });
    expect(errors.some((e) => e.property === 'pageSize')).toBe(true);
  });

  it('rejects non-integer page', async () => {
    const { errors } = await run({ page: '1.5' });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('rejects non-numeric page', async () => {
    const { errors } = await run({ page: 'abc' });
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('transforms numeric-string values into numbers', async () => {
    const { dto, errors } = await run({ page: '1', pageSize: '20' });
    expect(errors).toHaveLength(0);
    expect(typeof dto.page).toBe('number');
    expect(typeof dto.pageSize).toBe('number');
  });
});
