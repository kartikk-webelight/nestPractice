import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { postEntity, PostStatus } from './post.entity';
import { Repository } from 'typeorm';
import { createPostDto } from './post.dto';
import { UsersService } from '../users/users.service';
import { updatePost } from './post.types';

@Injectable()
export class PostService {

    constructor(
        @InjectRepository(postEntity)
        private readonly postRepository: Repository<postEntity>,
        private readonly usersService: UsersService
    ) { }

    async create(body: createPostDto, userId: string) {
        const { title, content } = body

        const user = await this.usersService.findById(userId)

        if (!user) {
            throw new UnauthorizedException("user not found")
        }

        const post = this.postRepository.create({
            title,
            content,
            author: user
        })

        const savedPost = await this.postRepository.save(post)

        if (!savedPost) {
            throw new NotFoundException("post not found")
        }

        return savedPost
    }

    async getAllPost() {
        const posts = await this.postRepository.find({
            relations: { author: true },
        })


        return posts

    }

    async getPostById(postId: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: { author: true }
        })

        if (!post) {
            throw new NotFoundException("post not found")
        }
        return post
    }

    async getMyposts(userId: string) {
        const posts = await this.postRepository.find({
            where: { author: { id: userId } },
            relations: { author: true }
        })

        return posts

    }

    async updatePost(body: updatePost, postId: string, userId: string) {
        const { title, content } = body


        const post = await this.postRepository.findOne({ where: { id: postId } })

        if (!post) {
            throw new NotFoundException("post not found")
        }
        if (post?.author.id !== userId) {
            throw new UnauthorizedException("not allowed to edit the post")
        }

        if (title && title !== undefined) {
            post.title = title
        }
        if (content && content !== undefined) {
            post.content = content
        }

        const updatedPost = await this.postRepository.save(post)

        if (!updatedPost) {
            throw new NotFoundException("updated post not found")
        }

        return updatedPost
    }

    async publishPost(postId: string, user: any) {

        const post = await this.postRepository.findOne({ where: { id: postId } })

        if (!post) {
            throw new NotFoundException("post not found")
        }

        if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
            throw new UnauthorizedException("not allowed to publish the post")
        }
        post.status = PostStatus.PUBLISHED
        post.publishedAt = new Date()

        const publishedPost = await this.postRepository.save(post)

        if (!publishedPost) {
            throw new NotFoundException("published post not found")
        }

        return publishedPost

    }

    async unPublishPost(postId: string, user: any) {

        const post = await this.postRepository.findOne({ where: { id: postId } })

        if (!post) {
            throw new NotFoundException("post not found")
        }

        if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
            throw new UnauthorizedException("not allowed to unpublish the post")
        }
        post.status = PostStatus.DRAFT

        const unPublishedPost = await this.postRepository.save(post)

        if (!unPublishedPost) {
            throw new NotFoundException("published post not found")
        }

        return unPublishedPost

    }

    async deletePost(postId: string, user: any) {
        const post = await this.postRepository.findOne({ where: { id: postId } })

        if (!post) {
            throw new NotFoundException("post not found")
        }
        if (post.author.id !== user.id && !["admin", "editor"].includes(user.role)) {
            throw new UnauthorizedException("not allowed to delete the post")
        }
        await this.postRepository.delete({ id: postId })

        return {}

    }

    async getPublishedPost() {
        const posts = await this.postRepository.find({
            where: { status: PostStatus.PUBLISHED },
            relations: { author: true }
        })

        return posts

    }



}
