import { MailerOptions } from "@nestjs-modules/mailer";
import { secretConfig } from "./secret.config";

const {
  mailtrapConfigs: { host, port, sandboxPassword, sandboxUsername },
} = secretConfig;

export const mailerConfig: MailerOptions = {
  transport: {
    host,
    port: Number(port),
    auth: {
      user: sandboxUsername,
      pass: sandboxPassword,
    },
  },
};
