import { Entity, Column } from "typeorm";
import * as bcrypt from "bcrypt";
import { BaseEntity } from "src/database/base-entity";
import { Exclude } from "class-transformer";
import { UserRole } from "src/enums/index";

@Entity("Users")
export class UserEntity extends BaseEntity {
  idPrefix = "user";

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  refreshToken: string;

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
