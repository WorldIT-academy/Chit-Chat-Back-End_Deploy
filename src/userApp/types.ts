import { Prisma } from "../generated/prisma";

export type User = Prisma.ProfileGetPayload<{
    select: {
        id: true,
        auth_user: true
        date_of_birth: true,
        signature: true,
        avatar: true,
        chat_group_members: true, 
        chat_messages: true,
        administered_groups: true
    }
}>


export type CreateUser = Prisma.ProfileUncheckedCreateInput

export type UpdateUser = Prisma.ProfileUncheckedUpdateInput
