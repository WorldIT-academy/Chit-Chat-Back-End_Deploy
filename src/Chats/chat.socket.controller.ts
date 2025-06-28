import { MessagePayload } from "../Messages/message.type";
import { AuthenticatedSocket } from "../types/socket";
import { chatService } from "./chat.service";
import { IChatUpdatePayload, IJoinChatCallback, IJoinChatPayload, ILeaveChatPayload } from "./chat.type";

import { Server } from "socket.io";

let io: Server;

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


function leaveChat(socket: AuthenticatedSocket, data: ILeaveChatPayload) {
    const chatRoomName = `chat_${serializeBigInt(data).chatId}`;
    socket.leave(chatRoomName)
}

async function joinChat(socket: AuthenticatedSocket, data: IJoinChatPayload, callback: IJoinChatCallback) {
    const chatRoomName = `chat_${data.chatId}`;
    socket.join(chatRoomName);
    const result = await chatService.joinChat(serializeBigInt(data).chatId);
    if (result.status === "success") {
        if (typeof callback === "function") {
            callback({ status: "success", data: serializeBigInt(result.data) });
        }
    }
}

function updateChat(socket: AuthenticatedSocket, data: IChatUpdatePayload) {

}

function registerChat(socket: AuthenticatedSocket) {
    socket.on("joinChat", (data, callback) => {
        joinChat(socket, serializeBigInt(data), callback);
    });

    socket.on("leaveChat", (data) => {
        leaveChat(socket, serializeBigInt(data));
    });

    socket.on("sendMessage", async (data: MessagePayload) => {

        await chatService.saveMessage(serializeBigInt(data));
        const room = `chat_${serializeBigInt(data).chat_group_id}`;
        io.to(room).emit("newMessage", serializeBigInt(data));
    });
}


export function setSocketServerInstance(ioInstance: Server) {
    io = ioInstance;
}

export const chatSocketController = {
    registerChat,
    updateChat,
    joinChat,
    leaveChat,
};