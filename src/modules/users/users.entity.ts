import { Entity, Column, BeforeInsert, AfterLoad } from "typeorm";
import { BaseEntity } from "../database/base-entity";
import * as bcrypt from "bcrypt";
@Entity("Users")
export class UsersEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  refreshToken: string;

  async setPassword(password: string) {
    this.password = await bcrypt.hash(password, 10);
  }

  async isPasswordCorrect(Password: string): Promise<boolean> {
    return await bcrypt.compare(Password, this.password);
  }
}
