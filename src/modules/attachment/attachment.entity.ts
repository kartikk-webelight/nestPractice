import { Column, Entity } from "typeorm";
import { BaseEntity } from "database/base-entity";
import { EntityType } from "enums";

@Entity("Attachments")
export class AttachmentEntity extends BaseEntity {
  idPrefix = "a";
  @Column()
  path: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column({ type: "enum", enum: EntityType })
  entityType: EntityType;

  @Column()
  externalId: string;

  @Column({ nullable: true })
  originalName?: string;
}
