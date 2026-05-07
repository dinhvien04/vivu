import { FastifyInstance } from 'fastify';
import { applySecurityHeaders } from '../../apps/api/src/common/security-headers';

describe('Security Headers', () => {
  let mockApp: Partial<FastifyInstance>;
  let mockReply: any;
  let onSendHook: any;

  beforeEach(() => {
    mockReply = {
      getHeader: jest.fn(),
      header: jest.fn(),
    };

    mockApp = {
      addHook: jest.fn((event, handler) => {
        if (event === 'onSend') {
          onSendHook = handler;
        }
      }),
    };
  });

  it('should register onSend hook', () => {
    applySecurityHeaders(mockApp as FastifyInstance);
    
    expect(mockApp.addHook).toHaveBeenCalledWith('onSend', expect.any(Function));
  });

  describe('onSend hook', () => {
    beforeEach(() => {
      applySecurityHeaders(mockApp as FastifyInstance);
    });

    it('should set all security headers when none exist', () => {
      mockReply.getHeader.mockReturnValue(undefined);
      const done = jest.fn();

      onSendHook({}, mockReply, 'payload', done);

      expect(mockReply.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockReply.header).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockReply.header).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(mockReply.header).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off');
      expect(mockReply.header).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none');
      expect(mockReply.header).toHaveBeenCalledWith('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
      expect(done).toHaveBeenCalledWith(null, 'payload');
    });

    it('should not override existing headers', () => {
      mockReply.getHeader.mockImplementation((name: string) => {
        return name === 'X-Frame-Options' ? 'SAMEORIGIN' : undefined;
      });
      const done = jest.fn();

      onSendHook({}, mockReply, 'payload', done);

      expect(mockReply.header).not.toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockReply.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(done).toHaveBeenCalledWith(null, 'payload');
    });

    it('should preserve payload', () => {
      mockReply.getHeader.mockReturnValue(undefined);
      const done = jest.fn();
      const testPayload = { test: 'data' };

      onSendHook({}, mockReply, testPayload, done);

      expect(done).toHaveBeenCalledWith(null, testPayload);
    });

    it('should set HSTS header with correct max-age', () => {
      mockReply.getHeader.mockReturnValue(undefined);
      const done = jest.fn();

      onSendHook({}, mockReply, 'payload', done);

      expect(mockReply.header).toHaveBeenCalledWith(
        'Strict-Transport-Security', 
        'max-age=15552000; includeSubDomains'
      );
    });

    it('should set X-Content-Type-Options to nosniff', () => {
      mockReply.getHeader.mockReturnValue(undefined);
      const done = jest.fn();

      onSendHook({}, mockReply, 'payload', done);

      expect(mockReply.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should set X-Frame-Options to DENY', () => {
      mockReply.getHeader.mockReturnValue(undefined);
      const done = jest.fn();

      onSendHook({}, mockReply, 'payload', done);

      expect(mockReply.header).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });
  });
});