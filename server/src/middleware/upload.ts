import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { HttpError } from "./errorHandler";

export const uploadsRootDir = path.join(__dirname, "..", "..", "uploads");
export const menuItemImagesDir = path.join(uploadsRootDir, "menu-items");

fs.mkdirSync(menuItemImagesDir, { recursive: true });

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, menuItemImagesDir),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_IMAGE_EXTENSIONS[file.mimetype] ?? path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadMenuItemImageMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_EXTENSIONS[file.mimetype]) {
      cb(new HttpError(400, "Only JPEG, PNG, WEBP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("image");

// Best-effort cleanup — a stale file left behind on disk is harmless, so a
// deletion failure here shouldn't fail the request that triggered it.
export function deleteUploadedImage(imageUrl: string) {
  const relativePath = imageUrl.replace(/^\/uploads\//, "");
  const filePath = path.join(uploadsRootDir, relativePath);
  fs.unlink(filePath, () => {});
}
