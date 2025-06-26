import { post_app_album_images } from "./../generated/prisma/index.d";
import { Prisma } from "../generated/prisma";

export type Album = Prisma.AlbumGetPayload<{
	include: {
		images: {
			select: {
				image: true;
			};
		};
		post_app_tag: true;
	},
}>;

export type AlbumCorrect = Prisma.AlbumGetPayload<{
	include: {
		post_app_tag: true;
	};
}>;

export type CreateAlbum = Prisma.AlbumUncheckedCreateInput

export type UpdateAlbum = Prisma.AlbumUncheckedUpdateInput;

// export type CreateAlbumData = Prisma.AlbumImagesUncheckedCreateNestedManyWithoutAlbumInput;
export type CreateAlbumData = Prisma.post_app_album_imagesUncheckedCreateNestedManyWithoutAlbumInput;

export type AlbumUpdateBody = {
	name?: string;
	tags?: string;
	images?: {
		image: {
			id?: bigint;
			filename: string;
		};
	}[];
	created_at?: Date;
};

export type AlbumBody = {
	name: string;
	topic?: string[];
};

export type CreateAlbumBody = {
	name: string;
	topic: string;
	author_id: bigint;
	images?: undefined;
};
