import { DataReportsService } from './data-reports.service';

describe('DataReportsService', () => {
  it('does not persist honeypot reports', async () => {
    const prisma = { dataReport: { create: jest.fn() } };
    const service = new DataReportsService(prisma as never);

    await expect(
      service.create({
        placeSlug: 'bien-ho',
        type: 'wrong_description',
        message: 'Bot report',
        website: 'spam.example',
      }),
    ).resolves.toEqual({ ok: true, spam: true });
    expect(prisma.dataReport.create).not.toHaveBeenCalled();
  });

  it('persists public reports for admin review', async () => {
    const prisma = {
      dataReport: {
        create: jest.fn().mockResolvedValue({ id: 'report-1' }),
      },
    };
    const service = new DataReportsService(prisma as never);

    await expect(
      service.create({
        placeSlug: 'bien-ho',
        type: 'wrong_coordinates',
        message: 'Toa do chua dung',
        contact: '0909000000',
      }),
    ).resolves.toEqual({ ok: true, id: 'report-1' });

    expect(prisma.dataReport.create).toHaveBeenCalledWith({
      data: {
        placeSlug: 'bien-ho',
        type: 'wrong_coordinates',
        message: 'Toa do chua dung',
        contact: '0909000000',
      },
      select: { id: true },
    });
  });
});
