import { StorageDriver, DiskOptions, FileOptions } from '../interfaces';
import { S3 } from 'aws-sdk';
import { getMimeFromExtension } from '../helpers';
import { HeadObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';
import { Storage } from '../storage';

export class S3Storage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions;
  private client: S3;

  constructor(disk: string, config: DiskOptions) {
    this.disk = disk;
    this.config = config;
    this.client = new S3({
      accessKeyId: this.config.key,
      secretAccessKey: this.config.secret,
      signatureVersion: 'v4',
      region: this.config.region,
    });
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
    options?: FileOptions
  ): Promise<any> {
    const { mimeType } = options || {};
    let params = {
      Bucket: this.config.bucket,
      Key: path,
      Body: fileContent,
      ContentType: mimeType ? mimeType : getMimeFromExtension(path),
    };

    return await this.client.upload(params as PutObjectRequest).promise();
  }

  /**
   * Get Signed Urls
   * @param path
   */
  async signedUrl(path: string, expire = 20): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
      Expires: 60 * expire,
    };
    const signedUrl = await this.client.getSignedUrlPromise(
      'getObject',
      params
    );
    return signedUrl;
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<any> {
    const params = {
      Bucket: this.config.bucket || '',
      Key: path,
    };

    return await this.client.getObject(params).promise();
  }

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  async exists(path: string): Promise<boolean> {
    const meta = await this.getMetaData(path);
    if (meta) {
      return true;
    }
    return false;
  }

  /**
   * Get object's metadata
   * @param path
   */
  async getMetaData(path: string): Promise<Record<string, any> | null> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
    };

    try {
      const res = await this.client
        .headObject(params as HeadObjectRequest)
        .promise();
      return res;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  async missing(path: string): Promise<boolean> {
    const meta = await this.getMetaData(path);
    if (!meta) {
      return true;
    }
    return false;
  }

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(path: string): string {
    return '';
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    const params = {
      Bucket: this.config.bucket || '',
      Key: path,
    };

    try {
      await this.client.deleteObject(params).promise();
    } catch (err) {
      return false;
    }

    return true;
  }

  /**
   * Get instance of driver's client.
   */
  getClient(): S3 {
    return this.client;
  }

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any> {
    return this.config;
  }

  async copy(filePath: string, destinationDisk: string): Promise<boolean> {
    const file = await this.get(filePath);
    const disk = Storage.disk(destinationDisk);
    const fileExists = await this.exists(filePath);
    if (!fileExists) {
      throw new Error('Invalid File Path');
    }
    await disk.put(filePath, file.Body);
    const exists = await disk.exists(filePath);
    return new Promise((resolve, reject) => {
      if (exists) {
        resolve(true);
      }
      reject(false);
    });
  }
}
