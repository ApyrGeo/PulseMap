import { BASE_API_URL } from '../../core';
import { TokenService } from '../../auth/TokenService';

export interface UploadImageResult {
  url: string;
  filename: string;
}

/**
 * Upload an image via backend to Azure Blob Storage
 * @param file The image file to upload
 * @returns The URL of the uploaded image (via backend proxy)
 */
export async function uploadImageToAzure(
  file: File
): Promise<UploadImageResult> {
  try {
    const formData = new FormData();
    formData.append('images', file);

    const response = await fetch(`${BASE_API_URL}/image/upload`, {
      method: 'POST',
      headers: {
        ...TokenService.getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload image: ${response.statusText} - ${errorText}`
      );
    }

    const filenames: string[] = await response.json();
    const filename = filenames[0];

    return {
      url: `${BASE_API_URL}/image/${filename}`,
      filename,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload multiple images via backend to Azure Blob Storage
 * @param files Array of image files to upload
 * @returns Array of URLs of the uploaded images (via backend proxy)
 */
export async function uploadMultipleImagesToAzure(
  files: File[]
): Promise<UploadImageResult[]> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch(`${BASE_API_URL}/image/upload`, {
      method: 'POST',
      headers: {
        ...TokenService.getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload images: ${response.statusText} - ${errorText}`
      );
    }

    const filenames: string[] = await response.json();

    return filenames.map((filename) => ({
      url: `${BASE_API_URL}/image/${filename}`,
      filename,
    }));
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Delete an image from Azure Blob Storage via backend
 * @param imageUrl The URL of the image to delete
 */
export async function deleteImageFromAzure(imageUrl: string): Promise<void> {
  try {
    const response = await fetch(
      `${BASE_API_URL}/image?imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: 'DELETE',
        headers: {
          ...TokenService.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete image: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
