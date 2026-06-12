import { BadRequestException } from '@nestjs/common';
import { InputRouterService } from './input-router.service';

describe('InputRouterService', () => {
  const service = new InputRouterService();
  const image = { buffer: Buffer.from('image'), contentType: 'image/jpeg' };

  it('routes message only to text_only', () => {
    expect(service.route('hello')).toBe('text_only');
  });

  it('routes image only to image_only', () => {
    expect(service.route(undefined, image)).toBe('image_only');
  });

  it('routes message and image to image_text', () => {
    expect(service.route('hello', image)).toBe('image_text');
  });

  it('rejects empty input', () => {
    expect(() => service.route('  ')).toThrow(BadRequestException);
  });
});
