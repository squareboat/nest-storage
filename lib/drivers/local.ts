import { StorageDriver } from '../interfaces';
import * as fs from 'fs';
import * as path from 'path';

export class Local implements StorageDriver {
  private disk: string;
  private config: Record<string, any>;

  constructor(disk: string, config: Record<string, any>) {
    this.disk = disk;
    this.config = config;
  }

  getMetaData(filePath: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      if (!this.exists(filePath)) {
        reject('File path not found');
      } else {
        fs.open(filePath, 'r', (err, file_descriptor) => {
          if (err) {
            reject(`Can't read file`);
          }
          const metaData = fs.fstatSync(file_descriptor);
          resolve({
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
  async put(filePath: string, fileContent: any): Promise<any> {
    let dir_paths = [];
    let final_path = filePath;
    while (!fs.existsSync(filePath)) {
      filePath = path.dirname(filePath);
      dir_paths.push(filePath);
    }
    for (let path of dir_paths.reverse()) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
      }
    }
    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(final_path, Buffer.from(fileContent));
        resolve();
      } catch (e) {
        reject(new Error('Failed to write file.'));
      }
    });
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.exists(filePath)) {
        resolve(fs.readFileSync(filePath));
      } else {
        reject(new Error('Invalid file path'));
      }
    });
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
  async exists(filePath: string): Promise<boolean> {
    return fs.existsSync(filePath);
  }

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  async missing(filePath: string): Promise<boolean> {
    return !this.exists(filePath);
  }

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(filePath: string): string {
    return `${this.config.base_url}/public/${filePath}`;
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.exists(filePath)) {
        try {
          fs.unlinkSync(filePath);
          resolve(true);
        } catch (e) {
          reject(new Error('Unable to delete file'));
        }
      } else {
        reject(false);
      }
    });
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
