import { ValidationPipe, VersioningType } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { json as expressJson, urlencoded as expressUrlencoded } from "express";
import { allowedOrigins, globalPrefix } from "src/constants/app.constants";
import { HttpAdapterHost } from "@nestjs/core";
import { MainExceptionFilter } from "src/filters/main-exception.filter";
import { init } from "@sentry/node";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { appConfig } from "./config/app.config";
import { QueryCountInterceptor } from "./interceptors/query-counter-interceptor";
import { swaggerInfo } from "./constants/app.constants";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ----- START SENTRY CONFIGURATION -----
  if (appConfig.sentryDsn) {
    init({
      dsn: appConfig.sentryDsn,
      tracesSampleRate: 1.0,
      debug: false,
    });
  }
  // ----- END SENTRY CONFIGURATION -----

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new MainExceptionFilter(httpAdapter));

  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.enableCors({ credentials: true, origin: allowedOrigins });

  app.use(cookieParser());
  app.use(expressJson({ limit: "10mb" })); // allow 10mb request limit
  app.use(expressUrlencoded({ limit: "10mb", extended: true })); // URL-encoded requests limited to 5 MB

  if (appConfig.isLocal) {
    app.useGlobalInterceptors(new QueryCountInterceptor());
  }

  const config = new DocumentBuilder()
    .setTitle(swaggerInfo.title)
    .setDescription(swaggerInfo.description)
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
