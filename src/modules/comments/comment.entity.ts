import { BaseEntity } from "database/base-entity";
import { CommentStatus } from "enums";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

@Entity("Comments")
export class CommentEntity extends BaseEntity {
  idPrefix = "c";

  @Column()
  content: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  author: UserEntity;

  @ManyToOne(() => PostEntity, { nullable: false, onDelete: "CASCADE" })
  post: PostEntity;

  @ManyToOne(() => CommentEntity, (CommentEntity) => CommentEntity.child, {
    onDelete: "CASCADE",
    nullable: true,
  })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (CommentEntity) => CommentEntity.parentComment)
  child: CommentEntity[];

  @Column({
    type: "enum",
    enum: CommentStatus,
    default: CommentStatus.PENDING,
  })
  status: CommentStatus;

  @Column({ default: 0 })
  upvotes: number;

  @Column({ default: 0 })
  downvotes: number;
}
