import { Global, Module } from "@nestjs/common";
import { AiService } from "./ai/ai.service";
import { CloudinaryService } from "./cloudinary/cloudinary.service";

@Global()
@Module({
  providers: [CloudinaryService, AiService],
  exports: [CloudinaryService, AiService],
})
export class SharedModule {}
