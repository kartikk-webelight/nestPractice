import { BaseEntity } from "database/base-entity";
import { PostEntity } from "modules/post/post.entity";
import { UserEntity } from "modules/users/users.entity";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";

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

  @ManyToOne(() => CommentEntity, (CommentEntity) => CommentEntity.child, {
    onDelete: "CASCADE",
    nullable: true,
  })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (CommentEntity) => CommentEntity.parentComment)
  child: CommentEntity[];
}
