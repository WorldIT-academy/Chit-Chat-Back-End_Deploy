import { Prisma } from "../generated/prisma";

export type Post = Prisma.PostGetPayload<{
    include: {
        post_app_post_images: {
            select: {
                post_app_image: true
            }
        },
        post_app_post_tags: {
            select: {
                post_app_tag: true
            }
        }
    }
}>;


export type CreatePost = Prisma.PostUncheckedCreateInput;

type TagC = Prisma.TagsWhereUniqueInput

export type IUpdatePost = {
    title: string;
    content: string;
    topic: string
    links?: string[];
    tags?: string[];
    images?: {
        id?: bigint;
        url: string;
    }[]
    author_id: number;
};

// export type CreatePostData = Prisma.PostImagesUncheckedCreateNestedManyWithoutPostInput;
export type CreatePostData = Prisma.post_app_post_imagesUncheckedCreateNestedManyWithoutPost_app_postInput

export type Image = Prisma.ImageUncheckedCreateInput;

// export type CreateImageData = Prisma.PostImagesUncheckedCreateNestedManyWithoutPostInput
export type CreateImageData = Prisma.post_app_post_imagesUncheckedCreateNestedManyWithoutPost_app_postInput

export interface CreatePostBody {
    title: string;
    content: string;
    topic: string
    links?: string[];
    tags?: string[];
    images?: {
        url: string;
    }[]
    author_id: number;
}
// export type ImageCreate = Prisma.ImageCreateNestedOneWithoutPostImagesInput
export type ImageCreate = Prisma.post_app_post_imagesCreateNestedManyWithoutPost_app_imageInput

export type UpdateCreatePost = Prisma.PostUncheckedUpdateInput