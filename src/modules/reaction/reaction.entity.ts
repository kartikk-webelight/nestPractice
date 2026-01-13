import { BaseEntity } from "database/base-entity";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity("Votes")
export class ReactionEntity extends BaseEntity {
  idPrefix = "v";

  @Column()
  isLiked: boolean;

  @ManyToOne(() => PostEntity, {
    nullable: true,
    onDelete: "CASCADE",
  })
  post?: PostEntity;

  @ManyToOne(() => CommentEntity, {
    nullable: true,
    onDelete: "CASCADE",
  })
  comment?: CommentEntity;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  reactedBy: UserEntity;
}
