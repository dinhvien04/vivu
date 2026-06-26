import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LEAD_STATUSES } from './list-leads.query.dto';

export class UpdateLeadStatusDto {
  @ApiPropertyOptional({ enum: LEAD_STATUSES })
  @IsIn(LEAD_STATUSES as unknown as string[])
  status!: string;
}

export class UpdateLeadNoteDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNote?: string;
}
