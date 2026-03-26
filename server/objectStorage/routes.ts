import type { Express, RequestHandler } from "express";
import { SpacesStorageService, ObjectNotFoundError, isSpacesConfigured } from "./spaces";

// Security: Allowed file types for uploads (images, videos, documents)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
];

// Security: Maximum file size (100MB for videos, 10MB for images/docs)
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Security: Validate file extension matches content type
const MIME_TO_EXTENSION: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'application/pdf': ['.pdf'],
};

function validateFileUpload(name: string, size: number | undefined, contentType: string | undefined): { valid: boolean; error?: string } {
  // Validate file name
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Missing or invalid file name" };
  }
  
  // Sanitize file name - remove path traversal attempts
  const sanitizedName = name.replace(/[/\\]/g, '_').replace(/\.\./g, '_');
  if (sanitizedName !== name) {
    return { valid: false, error: "Invalid characters in file name" };
  }
  
  // Validate content type
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
    return { valid: false, error: `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }
  
  // Validate file extension matches content type
  const extension = name.toLowerCase().slice(name.lastIndexOf('.'));
  const allowedExtensions = MIME_TO_EXTENSION[contentType.toLowerCase()];
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return { valid: false, error: "File extension does not match content type" };
  }
  
  // Determine max size based on content type
  const isVideo = contentType?.startsWith('video/');
  const maxSize = isVideo ? MAX_FILE_SIZE : MAX_IMAGE_SIZE;
  
  // Validate file size
  if (size !== undefined && (typeof size !== 'number' || size <= 0 || size > maxSize)) {
    return { valid: false, error: `File size must be between 1 byte and ${maxSize / (1024 * 1024)}MB` };
  }
  
  return { valid: true };
}

/**
 * Register object storage routes for file uploads via DigitalOcean Spaces.
 *
 * Upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. Client uploads directly to the presigned URL (PUT)
 *
 * Security: Auth required, file type validation, size limits, path traversal prevention.
 */
export function registerObjectStorageRoutes(app: Express, isAuthenticated?: RequestHandler): void {
  const spacesService = new SpacesStorageService();

  const uploadMiddleware = isAuthenticated ? [isAuthenticated] : [];
  app.post("/api/uploads/request-url", ...uploadMiddleware, async (req, res) => {
    try {
      if (!isSpacesConfigured()) {
        return res.status(503).json({
          error: "File storage is not configured. Please contact the administrator.",
        });
      }

      const { name, size, contentType } = req.body;

      // Security: Validate file before generating presigned URL
      const validation = validateFileUpload(name, size, contentType);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
        });
      }

      const { uploadURL, objectKey, objectPath } = await spacesService.getUploadUrl(contentType);
      const cdnUrl = spacesService.getCdnUrl(objectKey);

      res.json({
        uploadURL,
        objectPath,
        cdnUrl,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects (proxy through Express for non-CDN access).
   * For best performance, prefer using the CDN URL directly from the client.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      if (!isSpacesConfigured()) {
        return res.status(503).json({ error: "File storage is not configured." });
      }

      const rangeHeader = req.headers.range;
      await spacesService.downloadObject(req.path, res, rangeHeader);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      console.error("Error serving object:", error);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
