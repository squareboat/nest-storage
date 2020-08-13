import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface DiskOptions {
  driver?: string;
  key?: string;
  secret?: string;
  region?: string;
  bucket?: string;
  prefix?: string;
}

export interface StorageOptions {
  default?: string;
  disks: Record<string, DiskOptions>;
}

export interface StorageOptionsFactory {
  createStorageOptions(): Promise<StorageOptions> | StorageOptions;
}

export interface StorageAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  name?: string;
  useExisting?: Type<StorageOptions>;
  useClass?: Type<StorageOptions>;
  useFactory?: (...args: any[]) => Promise<StorageOptions> | StorageOptions;
  inject?: any[];
}
