import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsString } from "class-validator";

export function TrimString() {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }

      return typeof value === "string" ? value.trim() : value;
    }),
    IsString(),
  );
}
