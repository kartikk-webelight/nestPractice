import { Injectable } from "@nestjs/common";
import { generateKSUID } from "utils/helper.utils";

@Injectable()
export class SlugService {
  slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async buildSlug(title: string): Promise<string> {
    const id = await generateKSUID("s");

    const baseSlug = this.slugify(title);

    return `${baseSlug}-${id}`;
  }
}
