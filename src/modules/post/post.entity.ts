import { BaseEntity } from "src/database/base-entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { UserEntity } from "../users/users.entity";
import { PostStatus } from "src/enums/index";

@Entity("Posts")
export class PostEntity extends BaseEntity {
  idPrefix = "post";

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({
    type: "enum",
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ default: 0 })
  viewCount!: number;

  @Column({ default: 0 })
  upvotesCount!: number;

  @Column({ default: 0 })
  downvotesCount!: number;

  @Column({ type: "timestamp", nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({name:"authorId"})
  author: UserEntity;
}
