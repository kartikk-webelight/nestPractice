import { Column, Entity, ManyToOne } from "typeorm";
import { UserEntity } from "modules/users/users.entity";
import { BaseEntity } from "database/base-entity";
import { RoleStatus, UserRole } from "enums";

@Entity("Roles")
export class RoleEntity extends BaseEntity {
  protected idPrefix = "r";

  @ManyToOne(() => UserEntity)
  user: UserEntity; // user making the request

  @Column({
    type: "enum",
    enum: UserRole,
  })
  requestedRole: UserRole; // role they want

  @Column({
    type: "enum",
    enum: RoleStatus,
    default: RoleStatus.PENDING,
  })
  status: RoleStatus;

  @ManyToOne(() => UserEntity, { nullable: true })
  reviewedBy: UserEntity;
}
