import friendshipService from "./friendshipService";
import { Request, Response } from "express";
import { AcceptedFriendshipBody } from "./types";

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

async function createFriendship(req: Request, res: Response) {
	let body = req.body
	body.profile1_id = res.locals.userId
	console.log(body.profile1_id)
	const result = await friendshipService.createFriendship(body)
	if (result.status == "error") {
		res.json(result)
	} else {
		res.json(serializeBigInt(result));
	}
}
async function getFriendship(req: Request, res: Response) {
	const result = await friendshipService.getFriendship();
	if (result.status == "error") {
		res.json("error");
	} else {
		res.json(serializeBigInt(result));
	}
}

async function acceptFriendship(req: Request<{}, {}, AcceptedFriendshipBody>, res: Response) {
	let data = req.body
	const id = res.locals.userId
	const where = { profile1_id: data.id, profile2_id: id }
	console.log(where)
	const result = await friendshipService.acceptFriendship(where);
	if (result.status == "error") {
		res.json("error");
	} else {
		res.json(serializeBigInt(result));
	}
}

async function deleteFriendship(
	req: Request<{}, {}, AcceptedFriendshipBody>,
	res: Response
) {
	const userId = res.locals.userId;
	const { id: otherUserId } = req.body;

	const pairs = [
		{ profile1_id: otherUserId, profile2_id: userId, id: undefined},
		{ profile1_id: userId, profile2_id: otherUserId, id: undefined },
	];

	for (const where of pairs) {
		const result = await friendshipService.deleteFriendship(where);
		if (result.status === "success") {
			res.json(serializeBigInt(result));
		}
	}

	res.send("error")
}

const friendshipController = {
	createFriendship: createFriendship,
	getFriendship: getFriendship,
	acceptFriendship,
	deleteFriendship
}


export default friendshipController