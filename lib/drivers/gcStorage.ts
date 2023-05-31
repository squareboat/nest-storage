import {
  StorageDriver,
  DiskOptions,
  FileOptions,
  StorageDriver$FileMetadataResponse,
  StorageDriver$PutFileResponse,
  StorageDriver$RenameFileResponse,
} from "../interfaces";
import { getMimeFromExtension } from "../helpers";
import { Bucket, Storage, File } from "@google-cloud/storage";

export class GCStorage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions;
  private client: Storage;
  protected bucket: Bucket;

  constructor(disk: string, config: DiskOptions) {
    this.disk = disk;
    this.config = config;

    this.client = new Storage();
    this.bucket = this.client.bucket(config.bucket || "");
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

    await this._file(path).save(fileContent, {
      contentType: mimeType ? mimeType : getMimeFromExtension(path),
    });
    return { url: await this.url(path), path };
  }

  private _file(path: string): File {
    return this.bucket.file(path);
  }

  /**
   * Get Signed Urls
   * @param path
   */
  async signedUrl(path: string, expireInMinutes = 20): Promise<string> {
    const options = {
      action: "read" as const,
      expires: Date.now() + 1000 * 60 * expireInMinutes,
    };

    const [url] = await this.bucket.file(path).getSignedUrl(options);

    return url;
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<Buffer | null> {
    try {
      const result = await this._file(path).download();
      return result[0];
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
      const res = await this._file(path).getMetadata();
      return {
        path: path,
        contentType: res[0].contentType,
        contentLength: Number(res[0].size),
        lastModified: new Date(res[0].updated),
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
  async url(path: string): Promise<string> {
    const url = (await this.signedUrl(path, 20)).split("?")[0];
    return url;
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    try {
      const result = await this._file(path).delete();
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
    const srcFile = this._file(path);
    const destFile = this._file(newPath);

    await srcFile.copy(destFile);

    return { path: newPath, url: await this.url(newPath) };
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
    const srcFile = this._file(path);
    const destFile = this._file(newPath);
    await srcFile.move(destFile);
    return { path: newPath, url: await this.url(newPath) };
  }

  /**
   * Get instance of driver's client.
   */
  getClient(): Storage {
    return this.client;
  }

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
}
