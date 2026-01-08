import { BaseEntity } from "src/database/base-entity";
import { CommentStatus } from "src/enums";
import { PostEntity } from "src/modules/post/post.entity";
import { UserEntity } from "src/modules/users/users.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";


@Entity("Comments")
export class CommentEntity extends BaseEntity {
     idPrefix="comment"

     @Column()
     content:string

     @ManyToOne(()=>UserEntity, {nullable:false, onDelete:"CASCADE"})
     author:UserEntity

     @ManyToOne(()=>PostEntity,{nullable:false, onDelete:"CASCADE"})
     post:PostEntity

     @ManyToOne(()=> CommentEntity, (CommentEntity)=>CommentEntity.child, {
        onDelete:"CASCADE",
        nullable:true
     })
     @JoinColumn({name:"parentCommentId"})
     parentComment:CommentEntity | null

     @OneToMany(()=> CommentEntity, (CommentEntity)=>CommentEntity.parentComment)
     @JoinColumn({name:"parentCommentId"})
     child:CommentEntity[]

     @Column({
        type:"enum",
        enum:CommentStatus,
        default:CommentStatus.PENDING
    })
     commentStatus:CommentStatus

     @Column({default:0})
     upvotes:number

     @Column({default:0})
     downvotes:number

}
