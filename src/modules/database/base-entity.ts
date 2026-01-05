import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { UsersEntity } from "../users/users.entity";

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

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
}
