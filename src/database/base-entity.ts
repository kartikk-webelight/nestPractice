import { generateKSUID } from "src/utils/helper.utils";
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

export abstract class BaseEntity {
  protected abstract idPrefix: string;

  constructor() {
    Object.defineProperty(this, "idPrefix", {
      enumerable: false,
      writable: true,
      configurable: true,
      value: undefined,
    });
  }
  @PrimaryColumn()
  id: string;

  @CreateDateColumn({
    type: "timestamp with time zone",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp with time zone",
    select: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @BeforeInsert()
  async generateUniqueId() {
    if (!this.id) {
      this.id = await generateKSUID(this.idPrefix);
    }
  }
}
