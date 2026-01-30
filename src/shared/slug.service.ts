import { Injectable } from "@nestjs/common";
import slugify from "slugify";

@Injectable()
export class SlugService {
  private randomString(length = 6): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  buildSlug(title: string): string {
    const base = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });

    const randomSuffix = this.randomString();

    return `${base}-${randomSuffix}`;
  }
}
