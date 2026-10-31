import { ModuleMetadata, Type } from "@nestjs/common";

export interface DiskOptions {
  driver: "s3" | "local";
  profile?: string;
  region?: string;
  bucket?: string;
  prefix?: string;
  basePath?: string;
  accessKey?: string;
  secretKey?: string;
  /** @deprecated use `accessKey` */
  key?: string;
  /** @deprecated use `secretKey` */
  secret?: string;
  /** custom endpoint for S3-compatible services, e.g. https://nyc3.digitaloceanspaces.com */
  endpoint?: string;
  forcePathStyle?: boolean;
  /** local driver: public URL that serves `basePath` */
  baseUrl?: string;
  fetchRemoteCredentials?: boolean;
}

export interface StorageOptions {
  default: string;
  disks: Record<string, DiskOptions>;
}

export interface StorageOptionsFactory {
  createStorageOptions(): Promise<StorageOptions> | StorageOptions;
}

export interface StorageAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  name?: string;
  useExisting?: Type<StorageOptionsFactory>;
  useClass?: Type<StorageOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<StorageOptions> | StorageOptions;
  inject?: any[];
}
