import { Request, Response } from "express";
import { messageService } from "./message.service"


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

async function createMessage(req: Request, res: Response) {
    const body = req.body;
    body.ownerId = res.locals.userId
    const result = await messageService.createMessage(body)
    if (result.status == "error") {
        return;
    }
    res.json(serializeBigInt(result));
}

async function getMessage(req: Request, res: Response) {
    const id = req.params.id;
    const result = await messageService.getMessage(+id)
    if (result.status == "error") {
        return;
    }
    res.json(serializeBigInt(result));
}


export const messageController = {
    getMessage,
    createMessage,
}