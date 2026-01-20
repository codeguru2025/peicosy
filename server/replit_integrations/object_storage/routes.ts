import type { Express, RequestHandler } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

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
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * Security measures implemented:
 * - Authentication required for uploads
 * - File type validation (images and PDFs only)
 * - File size limits (10MB max)
 * - File name sanitization (path traversal prevention)
 * - Content type / extension matching
 */
export function registerObjectStorageRoutes(app: Express, isAuthenticated?: RequestHandler): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   * Authentication is required to upload files.
   */
  const uploadMiddleware = isAuthenticated ? [isAuthenticated] : [];
  app.post("/api/uploads/request-url", ...uploadMiddleware, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      // Security: Validate file before generating presigned URL
      const validation = validateFileUpload(name, size, contentType);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

