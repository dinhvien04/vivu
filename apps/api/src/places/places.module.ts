import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';

@Module({
  imports: [StorageModule],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
