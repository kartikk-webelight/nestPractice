import { UsersEntity } from "src/modules/users/users.entity";
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

  @Column({ nullable: true })
  createdBy?: string;

  @ManyToOne("UsersEntity", { nullable: true })
  @JoinColumn({ name: "createdBy" })
  creator?: UsersEntity;

  @Column({ nullable: true })
  updatedBy?: string;

  @ManyToOne("UsersEntity", { nullable: true })
  @JoinColumn({ name: "updatedBy" })
  updater?: UsersEntity;



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
