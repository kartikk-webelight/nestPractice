import { join } from "node:path";
import { MailerOptions } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { secretConfig } from "./secret.config";

const {
  mailtrapConfigs: { host, port, sandboxPassword, sandboxUsername },
} = secretConfig;

const templateDir =
  process.env.NODE_ENV === "production"
    ? join(process.cwd(), "dist/shared/email/templates")
    : join(process.cwd(), "src/shared/email/templates");

export const mailerConfig: MailerOptions = {
  transport: {
    host,
    port: Number(port),
    auth: {
      user: sandboxUsername,
      pass: sandboxPassword,
    },
  },
  template: {
    dir: templateDir,
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
};
