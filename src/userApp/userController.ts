import { Request, Response } from 'express'
import userService from './userService'

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

async function sendCode(req: Request, res: Response) {
    const data = req.body
    const resultEmail = await userService.sendEmail(data.email);
    res.json(serializeBigInt(resultEmail));
}

async function loginUser(req: Request, res: Response) {
    const data = req.body
    const result = await userService.login(data.email, data.password)
    res.json(serializeBigInt(result));
}

async function getUserById(req: Request, res: Response) {
    let id = res.locals.userId;
    const result = await userService.getUserById(id);
    res.json(serializeBigInt(result));
}
async function getUserByReqId(req: Request, res: Response) {
    let id = req.params.id
    const result = await userService.getUserById(+id);
    res.json(serializeBigInt(result))
}

async function registerUser(req: Request, res: Response) {
    let { code, ...user } = req.body
    userService.saveCode(user.email, code)
    const result = await userService.verifyCode(user.email, code)

    if (result.success === false) {
        res.json(result)
        return
    }
    const resultUser = await userService.registration(user)
    console.log(resultUser)
    res.json(serializeBigInt(resultUser))
}

async function updateUserById(req: Request, res: Response) {
    let id = +req.params.id
    let data = req.body
    const user = await userService.updateUserById(data, id);
    if (user.status == 'error') {
        res.send('error')
    }
    else {
        res.json(serializeBigInt(user));
    }
}

async function getUsers(req: Request, res: Response) {
    const context = await userService.getUsers();
    if (context.status == 'error') {
        res.send('error')
    }
    else {
        console.log(context.data)
        res.json(serializeBigInt(context.data))
    }
}

const userController = {
    registerUser,
    loginUser,
    getUserById,
    sendCode,
    updateUserById,
    getUsers,
    getUserByReqId

}

export default userController