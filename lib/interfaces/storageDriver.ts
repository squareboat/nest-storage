export interface StorageDriver {
  /**
   * Put file content to the path specified.
   *
   * @param path
   * @param fileContent
   */
  put(path: string, fileContent: any): Promise<any>;

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  get(path: string): Promise<any>;

  /**
   * Check if file exists at the path.
   *
   * @param path
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check if file is missing at the path.
   *
   * @param path
   */
  missing(path: string): Promise<boolean>;

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  url(path: string): string;

  /**
   * Get Signed Urls
   * @param path
   * @param expire
   */
  signedUrl(path: string, expire: number): Promise<string>;

  /**
   * Get object's metadata
   * @param path
   */
  getMetaData(path: string): Promise<Record<string, any> | null>;

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  delete(path: string): Promise<boolean>;

  /**
   * Get instance of driver's client.
   */
  getClient(): any;

  /**
   * Get config of the driver's instance.
   */
  getConfig(): Record<string, any>;

  copy(filePath: string, destinationDisk: string): Promise<boolean>;
}
