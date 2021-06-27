import {
  StorageDriver,
  DiskOptions,
  FileOptions,
  StorageDriver$FileMetadataResponse,
  StorageDriver$PutFileResponse,
  StorageDriver$RenameFileResponse,
} from "../interfaces";
import { S3, SharedIniFileCredentials } from "aws-sdk";
import { getMimeFromExtension } from "../helpers";
import { HeadObjectRequest, PutObjectRequest } from "aws-sdk/clients/s3";

export class S3Storage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions;
  private client: S3;

  constructor(disk: string, config: DiskOptions) {
    this.disk = disk;
    this.config = config;
    const options = {
      signatureVersion: "v4",
      region: this.config.region,
    } as Record<string, any>;

    if (config.profile) {
      options["credentials"] = new SharedIniFileCredentials({
        profile: config.profile,
      });
    }

    this.client = new S3(options);
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
  ): Promise<StorageDriver$PutFileResponse> {
    const { mimeType } = options || {};
    let params = {
      Bucket: this.config.bucket,
      Key: path,
      Body: fileContent,
      ContentType: mimeType ? mimeType : getMimeFromExtension(path),
    } as PutObjectRequest;

    const res = await this.client.upload(params).promise();
    return { url: this.url(path), path };
  }

  /**
   * Get Signed Urls
   * @param path
   */
  signedUrl(path: string, expireInMinutes = 20): string {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
      Expires: 60 * expireInMinutes,
    };

    const signedUrl = this.client.getSignedUrl("getObject", params);

    return signedUrl;
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<Buffer | null> {
    try {
      const params = { Bucket: this.config.bucket || "", Key: path };
      const res = await this.client.getObject(params).promise();
      return res.Body as Buffer;
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
   * Get object's metadata
   * @param path
   */
  async meta(path: string): Promise<StorageDriver$FileMetadataResponse> {
    const params = {
      Bucket: this.config.bucket,
      Key: path,
    };

    try {
      const res = await this.client
        .headObject(params as HeadObjectRequest)
        .promise();
      return {
        path: path,
        contentType: res.ContentType,
        contentLength: res.ContentLength,
        lastModified: res.LastModified,
      };
    } catch (e) {
      return {};
    }
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

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(path: string): string {
    const url = this.signedUrl(path, 20).split("?")[0];
    return url;
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    const params = { Bucket: this.config.bucket || "", Key: path };
    try {
      await this.client.deleteObject(params).promise();
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
  async copy(
    path: string,
    newPath: string
  ): Promise<StorageDriver$RenameFileResponse> {
    this.client
      .copyObject({
        Bucket: this.config.bucket || "",
        CopySource: this.config.bucket + "/" + path,
        Key: newPath,
      })
      .promise();
    return { path: newPath, url: this.url(newPath) };
  }

  /**
   * Move file internally in the same disk
   *
   * @param path
   * @param newPath
   */
  async move(
    path: string,
    newPath: string
  ): Promise<StorageDriver$RenameFileResponse> {
    await this.copy(path, newPath);
    await this.delete(path);
    return { path: newPath, url: this.url(newPath) };
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
}
