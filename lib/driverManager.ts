import { StorageDriver } from './interfaces';
import { Local, S3Storage, AliOssStorage } from './drivers';

export class DriverManager {
  private readonly driverMap: { [key: string]: any } = {
    local: Local,
    s3: S3Storage,
    oss: AliOssStorage,
  };

  getDriver(disk: string, config: Record<string, any>): StorageDriver {
    const driver = this.driverMap[config.driver];
    return new driver(disk, config);
  }
}
