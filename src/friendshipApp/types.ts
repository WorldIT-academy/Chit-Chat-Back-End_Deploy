import { Prisma } from "../generated/prisma"

export type IFriendship = Prisma.FriendshipGetPayload<{}>
export type CreateFriendship = Prisma.FriendshipUncheckedCreateInput
export type WhereFriendship = Prisma.FriendshipWhereInput;

export type DeleteFriendship = Prisma.FriendshipWhereUniqueInput;
export type UpdateFriendship = Prisma.FriendshipUpdateManyMutationInput;

export type AcceptedFriendshipBody = {
    id: number
}

// export type AcceptedFriendshipWhere = Prisma.FriendshipProfile1_idProfile2_idCompoundUniqueInput
// export type AcceptedFriendshipWhere = Prisma.FriendshipWhereUniqueInput
export type AcceptedFriendshipWhere = Prisma.FriendshipWhereInput

export type DeleteFriendshipWhere = Prisma.FriendshipWhereUniqueInput
