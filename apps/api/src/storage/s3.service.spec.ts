import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('S3Service presigned URL cache', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockedGetSignedUrl.mockReset();
  });

  it('reuses a signed URL for normalized variants of the same key', async () => {
    mockedGetSignedUrl.mockResolvedValue('https://signed.example/image');
    const service = new S3Service(
      makeConfig({
        AWS_REGION: 'ap-southeast-1',
        AWS_BUCKET_NAME: 'bucket',
        S3_PRESIGNED_EXPIRES_IN: '3600',
      }),
    );

    const first = await service.getPresignedGetUrl('s3://bucket/PLACE/image.jpg');
    const second = await service.getPresignedGetUrl('/PLACE/image.jpg');

    expect(first).toBe(second);
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('shares one signing operation across concurrent requests', async () => {
    let resolve!: (url: string) => void;
    mockedGetSignedUrl.mockImplementation(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );
    const service = new S3Service(
      makeConfig({
        AWS_REGION: 'ap-southeast-1',
        AWS_BUCKET_NAME: 'bucket',
      }),
    );

    const first = service.getPresignedGetUrl('PLACE/image.jpg');
    const second = service.getPresignedGetUrl('PLACE/image.jpg');
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);

    resolve('https://signed.example/image');
    await expect(Promise.all([first, second])).resolves.toEqual([
      'https://signed.example/image',
      'https://signed.example/image',
    ]);
  });

  it('refreshes the URL before the configured S3 expiry', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    mockedGetSignedUrl
      .mockResolvedValueOnce('https://signed.example/first')
      .mockResolvedValueOnce('https://signed.example/second');
    const service = new S3Service(
      makeConfig({
        AWS_REGION: 'ap-southeast-1',
        AWS_BUCKET_NAME: 'bucket',
        S3_PRESIGNED_EXPIRES_IN: '100',
      }),
    );

    await expect(service.getPresignedGetUrl('PLACE/image.jpg')).resolves.toContain('first');
    now.mockReturnValue(91_001);
    await expect(service.getPresignedGetUrl('PLACE/image.jpg')).resolves.toContain('second');
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(2);
  });
});
