import { MB } from '@server/config/upload-policies'
import multer from 'multer'

/**
 * Multipart parsing into memory with a hard cap; the type/size policy per category is applied
 * by the files service on the bytes themselves.
 */
export function uploadSingle(field = 'file', maxBytes = 10 * MB) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 20 },
  }).single(field)
}
