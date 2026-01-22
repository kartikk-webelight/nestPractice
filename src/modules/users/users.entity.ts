import * as bcrypt from "bcrypt";
import { Exclude } from "class-transformer";
import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "database/base-entity";
import { UserRole } from "enums/index";

@Entity("Users")
export class UserEntity extends BaseEntity {
  idPrefix = "u";

  @Column({ unique: true })
  @Index()
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.READER,
  })
  role: UserRole;

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  async isPasswordCorrect(Password: string): Promise<boolean> {
    return await bcrypt.compare(Password, this.password);
  }
}
