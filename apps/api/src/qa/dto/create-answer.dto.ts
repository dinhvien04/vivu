import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({ minLength: 5, maxLength: 2000, description: 'Nội dung câu trả lời.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  content!: string;
}
