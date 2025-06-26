import { Request, Response } from "express";
import postService from "./postService";
import { saveBase64Image } from "../../utils/fileUtil";
import { CreatePost, CreatePostBody } from "./types";

function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "bigint") return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInt);
    if (typeof obj === "object") {
        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = serializeBigInt(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

async function getPosts(req: Request, res: Response) {
	const result = await postService.getPosts();
	if (result.status == "error") {
		res.json("error");
	} else {
		console.log(serializeBigInt(result.data[1].post_app_post_images))
		res.json(serializeBigInt(result));
		// res.json(result)
	}
}


async function createPost(req: Request<{}, {}, CreatePostBody>, res: Response) {
	try {
		const newPost = req.body;
		let imagesToProcess: { url: string }[] = [];

		if (newPost.images) {
			console.log("Original images type:", typeof newPost.images);

			for (const img of newPost.images) {
				try {
					const savedPath = await saveBase64Image(img.url);
					console.log("Successfully saved image:", savedPath);
					imagesToProcess.push({ url: savedPath });
				} catch (imgError) {
					console.error("Failed to process image:", imgError);
				}
			}
			newPost.images = imagesToProcess
		}

		const result = await postService.createPost(newPost);

		if (result.status == "error") {
			res.json("error");
		} else {
			res.json(serializeBigInt(result));
		}

	} catch (error) {
		console.error("Full controller error:", error);
	}
}

async function deletePost(req: Request, res: Response) {
	let id = req.params.id;
	const result = await postService.deletePost(+id);
	if (result.status == "error") {
		res.json("error");
	} else {
		res.json(serializeBigInt(result));
		console.log("Post deleted successfully");
	}
}

async function editPost(req: Request, res: Response) {
	let body = req.body;
	let id = req.params.id;
	const result = await postService.editPost(body, +id);
	if (result.status == "error") {
		res.json("error");
	} else {
		res.json(serializeBigInt(result));
	}
}

const postController = {
	createPost,
	deletePost,
	editPost,
	getPosts,
};

export default postController;
