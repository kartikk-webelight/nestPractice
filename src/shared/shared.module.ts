import { Global, Module } from "@nestjs/common";
import { CloudinaryService } from "./cloudinary/cloudinary.service";

@Global()
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class SharedModule {}
