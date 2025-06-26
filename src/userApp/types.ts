import { Prisma } from "../generated/prisma";

export type User = Prisma.ProfileGetPayload<{
	select: {
		id: true;
		auth_user: true;
		date_of_birth: true;
		signature: true;
		avatar: true;
		chat_group_members: true;
		chat_messages: true;
		administered_groups: true;
	};
}>;
export interface IUpdateUser {
	password: string;
	username: string;
	first_name: string;
	last_name: string;
	email: string;
    date_of_birth: Date | string
    avatar: {
        image: string
    }[]
}

export type Avatar = Prisma.AvatarGetPayload<{}>
        
export type CreateUser = Prisma.ProfileUncheckedCreateInput & IUpdateUser

export type UpdateUser = Prisma.ProfileUncheckedUpdateInput & IUpdateUser;

export type UpdateUserPromise = Prisma.ProfileUncheckedUpdateInput 
