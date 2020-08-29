import { StorageDriver } from '../interfaces';
import * as fs from 'fs';

export class Local implements StorageDriver {
  private disk: string;
  private config: Record<string, any>;

  constructor(disk: string, config: Record<string, any>) {
    this.disk = disk;
    this.config = config;
  }

  getMetaData(path: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      if (!this.exists(path)) {
        return reject('File path not found');
      } else {
        fs.open(path, 'r', (err, file_descriptor) => {
          const metaData = fs.fstatSync(file_descriptor);
          return resolve({
            metaData,
          });
        });
      }
    });
  }

  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
  async put(path: string, fileContent: any): Promise<any> {
    return new Promise((resolve, reject) => {
      return resolve();
    });
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<any> {
    if (this.exists(path)) {
      return fs.readFileSync(path);
    }
    return null;
  }

  /**
   * Get Signed Urls
   * @param path
   */
  async signedUrl(path: string, expire = 10): Promise<string> {
    return '';
  }

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  async exists(path: string): Promise<boolean> {
    return fs.existsSync(path);
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  async missing(path: string): Promise<boolean> {
    return !this.exists(path);
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
    if (this.exists(path)) {
      fs.unlinkSync(path);
      return true;
    }
    return false;
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
