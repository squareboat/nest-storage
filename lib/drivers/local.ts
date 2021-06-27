import {
  DiskOptions,
  StorageDriver,
  StorageDriver$FileMetadataResponse,
  StorageDriver$PutFileResponse,
  StorageDriver$RenameFileResponse,
} from "../interfaces";
import { join } from "path";
import * as fs from "fs-extra";

export class Local implements StorageDriver {
  constructor(private disk: string, private config: DiskOptions) {}

  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
  async put(
    filePath: string,
    fileContent: any
  ): Promise<StorageDriver$PutFileResponse> {
    const res = await fs.outputFile(
      join(this.config.basePath || "", filePath),
      fileContent
    );
    return { path: join(this.config.basePath || "", filePath), url: "" };
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(filePath: string): Promise<Buffer> {
    const res = await fs.readFile(join(this.config.basePath || "", filePath));
    return res;
  }

  /**
   * Get object's metadata
   * @param path
   */
  async meta(filePath: string): Promise<StorageDriver$FileMetadataResponse> {
    const path = join(this.config.basePath || "", filePath);
    const res = await fs.stat(path);
    return {
      path,
      contentLength: res.size,
      lastModified: res.mtime,
    };
  }

  /**
   * Get Signed Urls
   * @param path
   */
  signedUrl(filePath: string, expire = 10): string {
    return "";
  }

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  async exists(filePath: string): Promise<boolean> {
    return fs.pathExists(join(this.config.basePath || "", filePath));
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  async missing(filePath: string): Promise<boolean> {
    return !(await this.exists(filePath));
  }

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(fileName: string) {
    if (this.config.hasOwnProperty("baseUrl")) {
      const filePath = join("public", fileName);
      return `${this.config.basePath}/${filePath}`;
    } else {
      return "";
    }
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(filePath: string): Promise<boolean> {
    try {
      await fs.remove(join(this.config.basePath || "", filePath));
    } catch (e) {}
    return true;
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
    const res = await fs.copy(
      join(this.config.basePath || "", path),
      join(this.config.basePath || "", newPath),
      { overwrite: true }
    );
    return {
      path: join(this.config.basePath || "", newPath),
      url: this.url(newPath),
    };
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
    return {
      path: join(this.config.basePath || "", newPath),
      url: this.url(newPath),
    };
  }

  /**
   * Get instance of driver's client.
   */
  getClient(): null {
    return null;
  }

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any> {
    return this.config;
  }
}
