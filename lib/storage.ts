import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Storage {
  static disk(disk: string) {
    return StorageService.getDriver(disk);
  }
}
