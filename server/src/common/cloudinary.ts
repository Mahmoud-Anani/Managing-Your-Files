import { randomUUID } from 'crypto';
import cloudinary from 'cloudinary';
import { env } from '../config/env';

cloudinary.v2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

export function cloudinaryPublicId(): string {
  return `managing-your-files/${randomUUID()}`;
}

export function cloudinaryResourceType(mimeType: string): 'image' | 'raw' {
  return mimeType.startsWith('image/') ? 'image' : 'raw';
}

export async function uploadToCloudinary(input: {
  buffer: Buffer;
  publicId: string;
  mimeType: string;
}): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        public_id: input.publicId,
        resource_type: cloudinaryResourceType(input.mimeType),
      },
      (error, result) => {
        if (error || !result) {
          reject(
            error
              ? new Error(error.message)
              : new Error('Cloudinary upload failed'),
          );
          return;
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    uploadStream.end(input.buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw',
): Promise<void> {
  await cloudinary.v2.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
