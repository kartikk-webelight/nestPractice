import { BaseEntity } from "src/database/base-entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { UsersEntity } from "../users/users.entity";

export enum PostStatus {
    DRAFT = "draft",
    PUBLISHED = "published"
}


Entity("Posts")
export class postEntity extends BaseEntity {
    idPrefix = "post"

    @Column()
    title: string

    @Column()
    content: string

    @Column({
        type: "enum",
        enum: PostStatus,
        default: PostStatus.DRAFT
    })
    status: PostStatus

    @Column({ default: 0 })
    viewCount!: number;

    @Column({ default: 0 })
    upvotesCount!: number;

    @Column({ default: 0 })
    downvotesCount!: number;

    @Column({ type: "timestamp", nullable: true })
    publishedAt?: Date;

    @ManyToOne(()=>UsersEntity, {nullable:false , onDelete:"CASCADE"})
    author:UsersEntity



}