import { NextFunction } from "express";
import { chatService } from "./chat.service";
import { Request, Response } from 'express'

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

async function getChats(req: Request, res: Response, next: NextFunction) {
    const chat = await chatService.getChats()

    res.json(serializeBigInt(chat))
}

async function getChat(req: Request, res: Response, next: NextFunction) {
    let id = req.params.id
    const chat = await chatService.getChat(+id)
    res.json(serializeBigInt(chat))
}

async function createChat(req: Request, res: Response){
    const data = req.body
    data.admin_id = res.locals.userId
    const chat = await chatService.createChat(data)
    res.json(serializeBigInt(chat))
    
}

export const chatController = {
    createChat,
    getChat,
    getChats
}