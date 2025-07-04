import prisma from "../client/prismaClient";
import { Prisma } from "../generated/prisma/client";
import { CreateAlbum, CreateAlbumBody, UpdateAlbum } from "./types";


async function getAlbums() {
    try {
        let post = await prisma.album.findMany(
            {
                include: {
                    images: {
                        select: {
                            image: true
                        }
                    },
                    post_app_tag: true
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

async function createAlbum(data: CreateAlbum) {
    try {
        console.log(data)
        let createAlbum = await prisma.album.create({
            data: data,
            include: {
                post_app_tag: true,
                images: true
            }
        })
        
        return createAlbum
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code == 'P2002') {
                console.log(err.message)
                throw err
            }
        }
        console.log(err)
    }
}

async function editAlbum(data: UpdateAlbum, id: number) {
    try {
        console.log(id)
        return await prisma.album.update({
            where: { id },
            data,
            include: {
                images: {
                    select: {
                        image: true
                    }
                },
                post_app_tag: true
            }
        });
    } catch (err) {
        console.log("Error in editAlbum:", err);
        throw err;
    }
}

async function deleteAlbum(id: number) {
    try {
        const deletedAlbum = await prisma.album.findUnique({
            where: { id },
            include: {
                images: {
                    select: {
                        image: true
                    }
                },
                post_app_tag: true
            }
        });

        if (!deletedAlbum) {
            throw console.log("Album not found!")
        }

        await prisma.post_app_album_images.deleteMany({
            where: { album_id: id }
        });

        const imageIds = deletedAlbum.images.map((img) => img.image.id);
        await prisma.image.deleteMany({
            where: { id: { in: imageIds } }
        });

        await prisma.album.delete({
            where: { id }
        });

        return deletedAlbum;
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}



const albumRepository = {
    getAlbums,
    createAlbum,
    editAlbum,
    deleteAlbum,

}
export { albumRepository }