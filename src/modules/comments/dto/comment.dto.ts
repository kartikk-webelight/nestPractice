import { IsNotEmpty } from "class-validator";
import { TrimString } from "src/decorators/trim-string.decorator";
import { ApiPropertyWritable } from "src/swagger/swagger.writable.decorator";

export class CommentContentDto {
    @ApiPropertyWritable({
        example: "this is a comment",
        description: "content of the comment"
    })
    @IsNotEmpty()
    @TrimString()
    content: string;
}

// UPDATE: Only needs content
export class UpdateCommentDto extends CommentContentDto {}

// CREATE: Needs content + postId
export class CreateCommentDto extends CommentContentDto {
    @TrimString()
    @IsNotEmpty()
    @ApiPropertyWritable({
        example: "post-mxmsoisx",
        description: "id of the post user is commenting on"
    })
    postId: string;
}

// REPLY: Needs content + postId + parentCommentId
export class ReplyCommentDto extends CreateCommentDto {
    @TrimString()
    @IsNotEmpty()
    @ApiPropertyWritable({
        example: "comment-mxmsoisx",
        description: "id of the parent comment"
    })
    parentCommentId: string;
}