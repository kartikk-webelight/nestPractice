import { BullRootModuleOptions } from "@nestjs/bullmq";
import { getOsEnvOptional } from "./env.config";

export const bullConfig: BullRootModuleOptions = {
  connection: {
    port: +(getOsEnvOptional("REDIS_PORT") ?? 6379),
    host: getOsEnvOptional("REDIS_HOST") ?? "localhost",
  },
};
