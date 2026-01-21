import { Injectable } from "@nestjs/common";

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

  buildSlug(title: string, id: string): string {
    const baseSlug = this.slugify(title);

    return `${baseSlug}-${id}`;
  }
}
