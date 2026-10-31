import { fromIni } from "@aws-sdk/credential-providers";
import { GetObjectCommand, HeadObjectCommandInput, PutObjectCommandInput, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import {
  StorageDriver,
  DiskOptions,
  FileOptions,
  StorageDriver$FileMetadataResponse,
  StorageDriver$PutFileResponse,
  StorageDriver$RenameFileResponse,
} from "../interfaces";
import { getMimeFromExtension } from "../helpers";

export class S3Storage implements StorageDriver {
  private readonly disk: string;
  private config: DiskOptions;
  private client: S3;

  constructor(disk: string, config: DiskOptions) {
    this.disk = disk;
    this.config = config;
    const options = {
      region: this.config.region,
    } as Record<string, any>;

    // S3-compatible services (DigitalOcean Spaces, MinIO, R2, ...)
    if (config.endpoint) {
      options["endpoint"] = config.endpoint;
      // AWS SDK v3.729+ sends CRC32 checksums by default, which some
      // S3-compatible services reject. Only send them when an API needs them.
      options["requestChecksumCalculation"] = "WHEN_REQUIRED";
      options["responseChecksumValidation"] = "WHEN_REQUIRED";
    }
    if (config.forcePathStyle !== undefined) options["forcePathStyle"] = config.forcePathStyle;

    // `key` / `secret` are accepted too, as older docs used those names (#19)
    const accessKeyId = config.accessKey ?? config.key;
    const secretAccessKey = config.secretKey ?? config.secret;
    if (config.profile) {
      options["credentials"] = fromIni({ profile: config.profile });
    } else if (accessKeyId && secretAccessKey) {
      options["credentials"] = { accessKeyId, secretAccessKey };
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
      Key: this.getPath(path),
      Body: fileContent,
      ContentType: mimeType || getMimeFromExtension(path) || undefined,
      ...(options?.s3Meta || {}),
    } as PutObjectCommandInput;

    await new Upload({
      client: this.client,
      params,
    }).done();
    return { url: await this.url(path), path: this.getPath(path) };
  }

  /**
   * Get Signed Urls
   * @param path
   */
  async signedUrl(path: string, expireInMinutes = 20): Promise<string> {
    const params = {
      Bucket: this.config.bucket,
      Key: this.getPath(path),
      Expires: 60 * expireInMinutes,
    };

    const signedUrl = await getSignedUrl(this.client, new GetObjectCommand(params), {
      expiresIn: 60 * expireInMinutes,
    });

    return signedUrl;
  }

  /**
   * Get file stored at the specified path.
   *
   * @param path
   */
  async get(path: string): Promise<Buffer | null> {
    try {
      const params = {
        Bucket: this.config.bucket || "",
        Key: this.getPath(path),
      };
      const res = await this.client.getObject(params);
      if (!res.Body) return null;
      // SDK v3 returns a stream; read it so get() still resolves to a Buffer like 0.1.x did
      return Buffer.from(await res.Body.transformToByteArray());
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
    return Object.keys(meta).length > 0;
  }

  /**
   * Get object's metadata
   * @param path
   */
  async meta(path: string): Promise<StorageDriver$FileMetadataResponse> {
    const params = {
      Bucket: this.config.bucket,
      Key: this.getPath(path),
    };

    try {
      const res = await this.client
        .headObject(params as HeadObjectCommandInput);
      return {
        path: this.getPath(path),
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
    return Object.keys(meta).length === 0;
  }

  /**
   * Get URL for path mentioned.
   *
   * @param path
   */
  async url(path: string): Promise<string> {
    const uri = await this.signedUrl(path, 20);
    return uri.split("?")[0];
  }

  /**
   * Delete file at the given path.
   *
   * @param path
   */
  async delete(path: string): Promise<boolean> {
    const params = {
      Bucket: this.config.bucket || "",
      Key: this.getPath(path),
    };
    try {
      await this.client.deleteObject(params);
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
    // CopySource must be URL-encoded; keep the slashes between key segments
    const source = this.getPath(path).split("/").map(encodeURIComponent).join("/");
    await this.client.copyObject({
      Bucket: this.config.bucket || "",
      CopySource: `${this.config.bucket}/${source}`,
      Key: this.getPath(newPath),
    });
    return { path: this.getPath(newPath), url: await this.url(newPath) };
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
    const copied = await this.copy(path, newPath);
    await this.delete(path);
    return copied;
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

  /**
   * Get path of the driver's instance.
   */
  getPath(path: string): string {
    return this.config.basePath ? `${this.config.basePath}/${path}` : path;
  }
}
