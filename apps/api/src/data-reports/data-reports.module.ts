import { Module } from '@nestjs/common';
import { AdminDataReportsController } from './admin-data-reports.controller';
import { DataReportsController } from './data-reports.controller';
import { DataReportsService } from './data-reports.service';

@Module({
  controllers: [DataReportsController, AdminDataReportsController],
  providers: [DataReportsService],
  exports: [DataReportsService],
})
export class DataReportsModule {}
