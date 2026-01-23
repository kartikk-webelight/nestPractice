import { Injectable } from "@nestjs/common";
import slugify from "slugify";
import { generateKSUID } from "utils/helper";

@Injectable()
export class SlugService {
  async buildSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    const slugId = (await generateKSUID("s")).slice(-6).toLowerCase();

    return `${baseSlug}-${slugId}`;
  }
}
