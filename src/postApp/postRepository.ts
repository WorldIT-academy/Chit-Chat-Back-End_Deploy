import prisma from "../client/prismaClient";
import { Prisma } from "../generated/prisma/client";
import { CreatePost, Post } from "./types";

async function getPosts() {
    try {
        let post = await prisma.post.findMany(
            {
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
            })
        return post
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code == 'P2002') {
                console.log(err.message);
                throw err;
            }
            if (err.code == 'P2015') {
                console.log(err.message);
                throw err;
            }
            if (err.code == 'P20019') {
                console.log(err.message);
                throw err;
            }
        }
    }
}

async function createPost(data: CreatePost) {
    try {
        let createPost = await prisma.post.create({
            data: data,
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
        })
        return createPost
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code == 'P2002') {
                console.log(err.message)
                throw err
            }
        }
    }
}

async function editPost(data: any, id: number) {
    try {
        return await prisma.post.update({
            where: { id },
            data,
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
        });
    } catch (err) {
        console.log("Error in editPost:", err);
        throw err;
    }
}

async function deletePost(id: number) {
    try {
        const postToDelete = await prisma.post.findUnique({
            where: { id },
            include: {
                post_app_post_images: {
                    include: {
                        post_app_image: true
                    }
                },
                post_app_post_tags: {
                    include: {
                        post_app_tag: true
                    }
                }
            }
        });

        if (!postToDelete) {
            throw console.log("Post not found!")
        }

        await prisma.post_app_post_images.deleteMany({
            where: { post_id: id }
        });

        const imageIds = postToDelete.post_app_post_images.map((img) => img.image_id);
        await prisma.image.deleteMany({
            where: { id: { in: imageIds } }
        });

        await prisma.post_app_post_tags.deleteMany({
            where: { post_id: id }
        });

        await prisma.post.delete({
            where: { id }
        });

        return postToDelete;
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}



const postRepository = {
    getPosts,
    createPost,
    editPost,
    deletePost,

}
export { postRepository }