import { EntityManager } from "typeorm";
import { EntityType } from "enums";

export interface BaseAttachment {
  externalId: string;
  entityType: EntityType;
  manager?: EntityManager;
}

export interface CreateAttachment extends BaseAttachment {
  file: Express.Multer.File;
}

export interface CreateAttachments extends BaseAttachment {
  files: Express.Multer.File[];
}

export type DeleteAttachments = BaseAttachment;
