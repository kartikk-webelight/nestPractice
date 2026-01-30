import { Column, Entity, ManyToOne, Unique } from "typeorm";
import { CommentEntity } from "modules/comments/comment.entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { BaseEntity } from "database/base-entity";

@Entity("Reactions")
@Unique("uq_reaction_user_post", ["reactedBy", "post"])
@Unique("uq_reaction_user_comment", ["reactedBy", "comment"])
export class ReactionEntity extends BaseEntity {
  idPrefix = "r";

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
