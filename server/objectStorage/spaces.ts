import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import type { Response } from "express";
import type { Readable } from "stream";

function getSpacesConfig() {
  const key = process.env.DO_SPACES_KEY;
  const secret = process.env.DO_SPACES_SECRET;
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const bucket = process.env.DO_SPACES_BUCKET;
  const region = process.env.DO_SPACES_REGION || "nyc3";
  const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT; // e.g. https://bucket.nyc3.cdn.digitaloceanspaces.com

  if (!key || !secret || !endpoint || !bucket) {
    return null;
  }

  return { key, secret, endpoint, bucket, region, cdnEndpoint };
}

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const config = getSpacesConfig();
  if (!config) {
    throw new Error(
      "DigitalOcean Spaces is not configured. Set DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_ENDPOINT, and DO_SPACES_BUCKET environment variables."
    );
  }

  _s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.key,
      secretAccessKey: config.secret,
    },
    forcePathStyle: false,
  });

  return _s3Client;
}

export function isSpacesConfigured(): boolean {
  return getSpacesConfig() !== null;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class SpacesStorageService {
  // Generate a presigned upload URL
  async getUploadUrl(
    contentType?: string
  ): Promise<{ uploadURL: string; objectKey: string; objectPath: string }> {
    const config = getSpacesConfig();
    if (!config) {
      throw new Error("DigitalOcean Spaces is not configured.");
    }

    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      ContentType: contentType || "application/octet-stream",
      ACL: "public-read",
    });

    const uploadURL = await getSignedUrl(getS3Client(), command, {
      expiresIn: 900, // 15 minutes
    });

    return {
      uploadURL,
      objectKey,
      objectPath: `/objects/${objectKey}`,
    };
  }

  // Get the public CDN URL for an object
  getCdnUrl(objectKey: string): string {
    const config = getSpacesConfig();
    if (!config) {
      throw new Error("DigitalOcean Spaces is not configured.");
    }

    // Strip leading /objects/ prefix if present
    const cleanKey = objectKey.startsWith("/objects/")
      ? objectKey.slice("/objects/".length)
      : objectKey;

    if (config.cdnEndpoint) {
      return `${config.cdnEndpoint}/${cleanKey}`;
    }

    // Fallback to direct Spaces URL
    const endpointUrl = new URL(config.endpoint);
    return `https://${config.bucket}.${endpointUrl.host}/${cleanKey}`;
  }

  // Normalize raw paths (e.g. full URLs) to /objects/... format
  normalizeObjectPath(rawPath: string): string {
    const config = getSpacesConfig();
    if (!config) return rawPath;

    // Already normalized
    if (rawPath.startsWith("/objects/")) return rawPath;

    // Full CDN or Spaces URL → extract key
    if (rawPath.startsWith("https://")) {
      try {
        const url = new URL(rawPath);
        const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
        return `/objects/${key}`;
      } catch {
        return rawPath;
      }
    }

    return rawPath;
  }

  // Resolve an /objects/... path to an S3 object key
  private resolveKey(objectPath: string): string {
    if (objectPath.startsWith("/objects/")) {
      return objectPath.slice("/objects/".length);
    }
    const parts = objectPath.startsWith("/") ? objectPath.slice(1) : objectPath;
    return parts;
  }

  // Stream an object to an Express response (supports Range requests)
  async downloadObject(
    objectPath: string,
    res: Response,
    rangeHeader?: string,
    cacheTtlSec: number = 31536000
  ): Promise<void> {
    const config = getSpacesConfig();
    if (!config) {
      throw new Error("DigitalOcean Spaces is not configured.");
    }

    const objectKey = this.resolveKey(objectPath);

    try {
      // Get metadata first
      const headCommand = new HeadObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
      });

      let metadata;
      try {
        metadata = await getS3Client().send(headCommand);
      } catch (err: any) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
          throw new ObjectNotFoundError();
        }
        throw err;
      }

      const contentType = metadata.ContentType || "application/octet-stream";
      const fileSize = metadata.ContentLength || 0;

      // Handle Range requests (video streaming)
      if (rangeHeader && fileSize > 0) {
        const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
        if (!rangeMatch) {
          res
            .status(416)
            .set({
              "Content-Range": `bytes */${fileSize}`,
              "Accept-Ranges": "bytes",
            })
            .end();
          return;
        }

        let start: number, end: number;

        if (rangeMatch[1] === "") {
          const suffixLength = parseInt(rangeMatch[2], 10);
          if (isNaN(suffixLength) || suffixLength <= 0) {
            res.status(416).set({ "Content-Range": `bytes */${fileSize}`, "Accept-Ranges": "bytes" }).end();
            return;
          }
          start = Math.max(0, fileSize - suffixLength);
          end = fileSize - 1;
        } else if (rangeMatch[2] === "") {
          start = parseInt(rangeMatch[1], 10);
          end = fileSize - 1;
        } else {
          start = parseInt(rangeMatch[1], 10);
          end = parseInt(rangeMatch[2], 10);
        }

        if (isNaN(start) || isNaN(end) || start < 0 || start >= fileSize || end < start || end >= fileSize) {
          res.status(416).set({ "Content-Range": `bytes */${fileSize}`, "Accept-Ranges": "bytes" }).end();
          return;
        }

        const chunkSize = end - start + 1;

        const getCommand = new GetObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
          Range: `bytes=${start}-${end}`,
        });

        const response = await getS3Client().send(getCommand);
        const stream = response.Body as Readable;

        res.status(206);
        res.set({
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": `public, max-age=${cacheTtlSec}`,
        });

        stream.pipe(res);
      } else {
        // Full file response
        const getCommand = new GetObjectCommand({
          Bucket: config.bucket,
          Key: objectKey,
        });

        const response = await getS3Client().send(getCommand);
        const stream = response.Body as Readable;

        res.set({
          "Content-Type": contentType,
          "Content-Length": String(fileSize),
          "Accept-Ranges": "bytes",
          "Cache-Control": `public, max-age=${cacheTtlSec}, immutable`,
          "Vary": "Accept-Encoding",
        });

        stream.pipe(res);
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) throw error;
      console.error("Error downloading from Spaces:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Delete an object from Spaces
  async deleteObject(objectPath: string): Promise<void> {
    const config = getSpacesConfig();
    if (!config) return;

    const objectKey = this.resolveKey(objectPath);

    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    });

    await getS3Client().send(command);
  }
}

export const spacesStorage = new SpacesStorageService();
