import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function makeHost(reply: { status: jest.Mock; send: jest.Mock }) {
  return {
    switchToHttp: () => ({
      getResponse: () => reply,
      getRequest: () => ({ url: '/api/v1/test', method: 'GET' }),
    }),
  } as never;
}

describe('AllExceptionsFilter', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns HttpException payload unchanged', () => {
    const filter = new AllExceptionsFilter();
    const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    filter.catch(new BadRequestException('Yêu cầu không hợp lệ.'), makeHost(reply));

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Yêu cầu không hợp lệ.',
      error: 'Bad Request',
    });
  });

  it('sanitizes unknown errors in production', () => {
    process.env.NODE_ENV = 'production';
    const filter = new AllExceptionsFilter();
    const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    filter.catch(new Error('secret prisma table leak'), makeHost(reply));

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
      error: 'Internal Server Error',
    });
  });

  it('maps Prisma known errors to a generic client message in production', () => {
    process.env.NODE_ENV = 'production';
    const filter = new AllExceptionsFilter();
    const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const prismaError = new Prisma.PrismaClientKnownRequestError('boom', {
      code: 'P2002',
      clientVersion: 'test',
    });
    filter.catch(prismaError, makeHost(reply));

    expect(reply.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(reply.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Yêu cầu không hợp lệ.',
    });
  });

  it('exposes error details outside production', () => {
    process.env.NODE_ENV = 'development';
    const filter = new AllExceptionsFilter();
    const reply = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    filter.catch(new HttpException('debug me', HttpStatus.INTERNAL_SERVER_ERROR), makeHost(reply));

    expect(reply.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'debug me',
    });
  });
});
