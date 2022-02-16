import {
  StorageDriver,
  DiskOptions,
  StorageDriver$FileMetadataResponse,
  StorageDriver$PutFileResponse,
  StorageDriver$RenameFileResponse,
} from "../interfaces";
import * as OSS from 'ali-oss';

export class AliOssStorage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions | any;
  private client: OSS;
  
  constructor(disk: string, config: DiskOptions|any) {
    this.disk = disk;
    this.config = config;
    const options = {
      region: this.config.region,
      bucket: this.config.bucket,
      endpoint: this.config.basePath,
      accessKeyId: this.config.key,
      accessKeySecret: this.config.secret,
    } as OSS.Options;
    
    this.client = new OSS(options);
    if (options.bucket) {
      this.client.useBucket(options.bucket);
    }
  }

  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
   async put(
    path: string,
    fileContent: any,
    options?: OSS.PutObjectOptions
  ): Promise<StorageDriver$PutFileResponse> {
    const res = await this.client.put(path, fileContent, options);
    return { url: this.url(path), path };
  }
  
  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<Buffer | null> {
    try {
      const res = await this.client.get(path);
      return res as unknown as Buffer;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  async exists(path: string): Promise<boolean> {
    const meta = await this.meta(path);
    return Object.keys(meta).length > 0 ? true : false;
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
   async missing(path: string): Promise<boolean> {
    const meta = await this.meta(path);
    return Object.keys(meta).length === 0 ? true : false;
  }
  
  url(path: string): string {
    const url = this.signedUrl(path, 20).split("?")[0];
    return url;
  }

  /**
   * Get Signed Urls
   * @param path
   */
  signedUrl(path: string, expireInMinutes: number): string {
    const options = {
      expires: expireInMinutes,
    } as OSS.SignatureUrlOptions;
    const signedUrl = this.client.signatureUrl(path, options);

    return signedUrl;
  }

  /**
   * Get object's metadata
   * @param path
   */
  async meta(path: string): Promise<StorageDriver$FileMetadataResponse> {
    const listQuery = {
      prefix: path,
    } as OSS.ListObjectsQuery;

    const res: OSS.ListObjectResult = await this.client.list(listQuery, {});
    let result = null;
    if (res.objects.length > 0) {
      result = res.objects[0];
      return {
        path: path,
        contentType: res.objects[0].type,
        contentLength: res.objects[0].size,
        lastModified: new Date(res.objects[0].lastModified),
      } as StorageDriver$FileMetadataResponse;
    } else {
      return {};
    }
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    try {
      await this.client.delete(path);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Copy file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  async copy(path: string, newPath: string): Promise<StorageDriver$RenameFileResponse> {
    const res: OSS.CopyAndPutMetaResult= await this.client.copy(newPath, path);
    return {
      path: newPath,
      url: this.url(newPath),
    } as StorageDriver$RenameFileResponse;
  }

  /**
   * Move file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  async move(path: string, newPath: string): Promise<StorageDriver$RenameFileResponse> {
    await this.copy(path, newPath);
    await this.delete(path);
    return { path: newPath, url: this.url(newPath) };
  }

  /**
   * Get instance of driver's client.
   */
   getClient(): OSS {
    return this.client;
  }

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
}
