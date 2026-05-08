import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5, description: 'Số sao đánh giá 1-5.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ minLength: 5, maxLength: 2000, description: 'Nội dung đánh giá.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;
}
