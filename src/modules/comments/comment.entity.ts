import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { BaseEntity } from "database/base-entity";

@Entity("Comments")
export class CommentEntity extends BaseEntity {
  idPrefix = "c";

  @Column()
  content: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  author: UserEntity;

  @ManyToOne(() => PostEntity, { nullable: false, onDelete: "CASCADE" })
  post: PostEntity;

  @ManyToOne(() => CommentEntity, (Comment) => Comment.child, {
    onDelete: "CASCADE",
    nullable: true,
  })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (Comment) => Comment.parentComment)
  child: CommentEntity[];
}
