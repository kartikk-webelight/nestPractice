import { Module } from "@nestjs/common";
import { AuthHelperService } from "./auth.helper.service";

@Module({
  providers: [AuthHelperService],
  exports: [AuthHelperService],
})
export class AuthHelperModule {}
