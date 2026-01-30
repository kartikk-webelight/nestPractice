import { Readable } from "node:stream";
import { Injectable, InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { secretConfig } from "config/secret.config";
import { ERROR_MESSAGES } from "constants/messages";

/**
 * Provides an interface for managing media assets on Cloudinary's cloud storage.
 *
 * @remarks
 * This service handles streaming file buffers to the cloud and implements a
 * "transactional" approach to multi-file uploads, ensuring that failed batch
 * uploads do not leave orphaned assets in storage.
 *
 * @group Infrastructure & Integration Services
 */
@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: secretConfig.cloudinaryConfigs.cloudName,
      api_key: secretConfig.cloudinaryConfigs.apiKey,
      api_secret: secretConfig.cloudinaryConfigs.apiSecret,
      secure: true,
    });
  }

  /**
   * Converts a Multer file buffer into a readable stream and pipes it to Cloudinary.
   *
   * @param file - The {@link Express.Multer.File} containing the raw buffer.
   * @returns A promise resolving to the {@link UploadApiResponse} containing asset metadata.
   * @throws InternalServerErrorException if the stream pipe fails.
   */
  async uploadBufferToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blogApp",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(new InternalServerErrorException("Cloudinary upload failed"));
          }
          resolve(result as UploadApiResponse);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Permanently removes an asset from cloud storage using its unique public identifier.
   *
   * @param publicId - The Cloudinary public ID of the resource to delete.
   * @returns A promise that resolves upon successful deletion.
   * @throws InternalServerErrorException if the deletion request is rejected.
   */
  async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      throw new InternalServerErrorException("Cloudinary delete failed");
    }
  }

  /**
   * A high-level wrapper for uploading a single file with external service error handling.
   *
   * @param file - The file to be uploaded.
   * @returns A promise resolving to the Cloudinary upload results.
   * @throws ServiceUnavailableException if the external cloud provider is unreachable or fails.
   */
  async uploadFileToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
    let uploadedFile: UploadApiResponse;
    try {
      uploadedFile = await this.uploadBufferToCloudinary(file);

      return uploadedFile;
    } catch {
      throw new ServiceUnavailableException(ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED);
    }
  }

  /**
   * Uploads multiple files simultaneously with an "all-or-nothing" safety mechanism.
   *
   * @remarks
   * If any file in the array fails to upload, the service automatically deletes
   * any files from the same batch that were successfully uploaded to maintain
   * data consistency.
   *
   * @param files - An array of {@link Express.Multer.File} objects.
   * @returns A promise resolving to an array of successful {@link UploadApiResponse} objects.
   * @throws ServiceUnavailableException if any part of the batch upload fails.
   */
  async uploadFilesToCloudinary(files: Express.Multer.File[]) {
    const uploadedFiles = await Promise.allSettled(
      files.map((file) => {
        return this.uploadBufferToCloudinary(file);
      }),
    );

    const successfullUploads = uploadedFiles
      .filter((file): file is PromiseFulfilledResult<UploadApiResponse> => file.status === "fulfilled")
      .map((file) => file.value);

    const hasFaliure = uploadedFiles.some((file) => file.status === "rejected");

    if (hasFaliure) {
      await Promise.all(successfullUploads.map((file) => this.deleteFromCloudinary(file.public_id)));

      throw new ServiceUnavailableException(ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED);
    }

    return successfullUploads;
  }
}
