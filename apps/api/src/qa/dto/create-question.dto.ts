import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ minLength: 5, maxLength: 1000, description: 'Nội dung câu hỏi.' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  content!: string;
}
