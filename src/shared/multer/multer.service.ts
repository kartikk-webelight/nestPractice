import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import multer from "multer";
import { FILE_CONSTANTS } from "constants/file.constants";

export const multerMemoryOptions: MulterOptions = {
  storage: multer.memoryStorage(),
  limits: {
    files: FILE_CONSTANTS.MAX_FILE_COUNT,
    fileSize: FILE_CONSTANTS.MAX_FILE_SIZE_IN_BYTES,
  },
};
