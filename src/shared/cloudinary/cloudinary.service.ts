import { Readable } from "stream";
import { Injectable, InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { secretConfig } from "config/secret.config";
import { ERROR_MESSAGES } from "constants/messages";

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

  async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      throw new InternalServerErrorException("Cloudinary delete failed");
    }
  }

  async uploadFileToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
    let uploadedFile: UploadApiResponse;
    try {
      uploadedFile = await this.uploadBufferToCloudinary(file);

      return uploadedFile;
    } catch {
      throw new ServiceUnavailableException(ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED);
    }
  }

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
