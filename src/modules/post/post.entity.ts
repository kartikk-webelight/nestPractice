import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { CategoryEntity } from "modules/category/category.entity";
import { UserEntity } from "modules/users/users.entity";
import { BaseEntity } from "database/base-entity";
import { PostStatus } from "enums/index";

@Entity("Posts")
export class PostEntity extends BaseEntity {
  idPrefix = "p";

  @Column()
  @Index()
  title: string;

  @Column()
  @Index()
  content: string;

  @Column({
    type: "enum",
    enum: PostStatus,
    default: PostStatus.DRAFT,
  })
  status: PostStatus;

  @Column({ default: 0 })
  @Index()
  viewCount: number;

  @Column({ default: 0 })
  @Index()
  likes: number;

  @Column({ default: 0 })
  @Index()
  dislikes: number;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column({ type: "timestamp", nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author: UserEntity;

  @ManyToMany(() => CategoryEntity)
  @JoinTable({ name: "post_categories" })
  categories!: CategoryEntity[];
}
