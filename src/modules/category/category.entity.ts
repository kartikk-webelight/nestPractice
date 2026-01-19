import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "database/base-entity";

@Entity("Categories")
export class CategoryEntity extends BaseEntity {
  idPrefix = "c";

  @Column()
  @Index()
  name: string;

  @Column()
  @Index()
  slug: string;

  @Column()
  description: string;
}
