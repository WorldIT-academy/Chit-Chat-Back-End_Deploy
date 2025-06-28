import { IError, IOkWithData } from "../types/types";
import {
	Album,
	CreateAlbum,
	UpdateAlbum,
	CreateAlbumBody,
	AlbumCorrect,
	AlbumUpdateBody,
} from "./types";
import fs from "fs/promises";
import path from "path";
import prisma from "../client/prismaClient";
import { albumRepository } from "./albumRepository";
import { API_BASE_URL } from "..";

async function getAlbums(): Promise<IOkWithData<Album[]> | IError> {
	const albums = await albumRepository.getAlbums();

	if (!albums) {
		return { status: "error", message: "No albums found" };
	}

	return { status: "success", data: albums };
}

async function createAlbum(
	data: CreateAlbumBody
): Promise<IOkWithData<AlbumCorrect> | IError> {
	try {
		let topicId: bigint;
		const createdImageUrls: string[] = [];
		const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");

		

		// Пошук або створення тегу
		let tag = await prisma.tags.findFirst({ where: { name: data.topic } });
		if (!tag) {
			tag = await prisma.tags.create({ data: { name: data.topic } });
		}
		topicId = tag.id;

		// Обробка зображень
		let correctImages = {};
		if (data.images) {
			const allowedFormats = ["jpeg", "png", "gif"];
			const maxSizeInBytes = 5 * 1024 * 1024; // 5 МБ
			const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");

			const createImages: { url: string }[] = [];

			for (const image of data.images) {
				try {
					if (!image.image.filename) continue;

					if (image.image.filename.startsWith("data:image")) {
						const matches = image.image.filename.match(
							/^data:image\/(\w+);base64,(.+)$/
						);
						if (!matches) continue;

						const [, ext, base64Data] = matches;
						if (!allowedFormats.includes(ext.toLowerCase())) continue;

						const buffer = Buffer.from(base64Data, "base64");
						if (buffer.length > maxSizeInBytes) continue;

						const filename = `${Date.now()}-${Math.round(
							Math.random() * 1000000
						)}.${ext}`;
						const filePath = path.join(uploadDir, filename);

						await fs.writeFile(filePath, buffer);
						createdImageUrls.push(filename);
						createImages.push({ url: `uploads/${filename}` });
					} else {
						createImages.push({ url: image.image.filename });
					}
				} catch (error) {
					console.error("Помилка обробки зображення:", error);
					continue;
				}
			}

			correctImages = {
				create: createImages.map((img) => ({
					image: {
						create: {
							filename: img.url,
							file: img.url,
							uploaded_at: new Date
						},
					},
				})),
			};
		}

		// Підготовка даних для альбому
		const albumData = {
			name: data.name,
			topic_id: topicId,
			author_id: BigInt(data.author_id),
			created_at: new Date(),
			shown: true,
			images: correctImages
		};

		const result = await albumRepository.createAlbum(albumData);

		if (!result) {
			// Видалення завантажених зображень у разі помилки
			for (const url of createdImageUrls) {
				try {
					await fs.unlink(path.join(uploadDir, url));
				} catch (error) {
					console.error("Помилка при видаленні зображення:", error);
				}
			}
			return { status: "error", message: "Альбом не було створено" };
		}

		return { status: "success", data: result };

	} catch (error) {
		console.error("Помилка при створенні альбому:", error);
		return { status: "error", message: "Внутрішня помилка сервера" };
	}
}
export async function editAlbum(
	data: AlbumUpdateBody,
	id: number
): Promise<IOkWithData<Album> | IError> {
	const createdImageUrls: string[] = [];

	try {
		console.log(data.images);
		const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");

		await fs.mkdir(uploadDir, { recursive: true });

		const currentAlbum = await prisma.album.findUnique({
			where: { id },
			include: {
				images: {
					select: {
						image: true,
					},
				},
				post_app_tag: true,
			},
		});

		const updateData: UpdateAlbum = {
			name:
				typeof data.name === "string"
					? data.name?.trim()
					: data.name ?? currentAlbum?.name,
		};

		// Обробка тегів
		if (data.tags) {
			if (
				typeof data.tags !== "string" ||
				data.tags.trim().length === 0
			) {
				console.error("[EditAlbum] Некоректний тег:", data.tags);
				return {
					status: "error",
					message: "Тег має бути непустим рядком",
				};
			}

			if (data.tags.length > 50) {
				console.error("[EditAlbum] Занадто довгий тег:", data.tags);
				return {
					status: "error",
					message: "Тег занадто довгий (макс. 50 символів)",
				};
			}

			let tag = await prisma.tags.findFirst({
				where: { name: data.tags },
			});

			if (!tag) {
				tag = await prisma.tags.create({
					data: { name: data.tags },
				});
			}
			updateData.topic_id = tag.id;
		} else {
			updateData.topic_id = undefined;
		}

		// Обробка зображень
		if (data.images) {
			const allowedFormats = ["jpeg", "png", "gif"];
			const maxSizeInBytes = 5 * 1024 * 1024; // 5 МБ

			const currentImages = currentAlbum?.images;

			console.log(currentImages);

			const imagesToDelete = currentImages?.filter((currentImg) => {
				if (data.images)
					return data.images.some(
						(newImg) => newImg.image.id === currentImg.image.id
					);
			});

			if (imagesToDelete) {
				if (imagesToDelete.length > 0) {
					await prisma.post_app_album_images.deleteMany({
						where: {
							album_id: id,
							image_id: {
								in: imagesToDelete.map((img) => img.image.id),
							},
						},
					});

					await prisma.image.deleteMany({
						where: {
							id: {
								in: imagesToDelete.map((img) => img.image.id),
							},
						},
					});
				}
			}

			const createImages: { url: string }[] = [];

			for (const image of data.images) {
				try {
					if (!image.image.filename) {
						continue;
					}
					if (image.image.filename.startsWith("data:image")) {
						const matches = image.image.filename.match(
							/^data:image\/(\w+);base64,(.+)$/
						);
						if (!matches) {
							console.error("[EditPost] Невірний формат base64");
							continue;
						}

						const [, ext, base64Data] = matches;
						if (!allowedFormats.includes(ext.toLowerCase())) {
							console.error(
								"[EditPost] Непідтримуваний формат зображення:",
								ext
							);
							continue;
						}

						const buffer = Buffer.from(base64Data, "base64");
						if (buffer.length > maxSizeInBytes) {
							console.error(
								"[EditPost] Зображення занадто велике:",
								buffer.length
							);
							continue;
						}

						const filename = `${Date.now()}-${Math.round(
							Math.random() * 1000000
						)}.${ext}`;
						const filePath = path.join(uploadDir, filename);

						await fs.writeFile(filePath, buffer);
						console.log(
							"[EditPost] Зображення збережено:",
							filePath
						);

						await fs.access(filePath);
						createdImageUrls.push(filename);

						createImages.push({ url: `uploads/${filename}` });
					} else {
						console.log(222);
						createImages.push({ url: image.image.filename });
					}
				} catch (error) {
					console.error(
						"[EditPost] Помилка обробки зображення:",
						error
					);
					continue;
				}
			}
			updateData.images = {
				create: createImages.map((img) => ({
					image: {
						create: {
							filename: img.url,
							file: img.url,
							uploaded_at: new Date
						},
					},
				})),
			};
		}

		// Оновлення поста
		console.log(
			"[EditPost] Дані для оновлення:",
			JSON.stringify(updateData, null, 2)
		);
		const updatedAlbum = await prisma.album.update({
			where: { id },
			data: updateData,
			include: {
				images: { include: { image: true } },
				post_app_tag: true,
			},
		});

		// Нормалізація URL зображень
		const normalizedAlbum = {
			...updatedAlbum,
			images: updatedAlbum.images.map((img) => {
				const relativeUrl = img.image.filename
					.replace(/\\/g, "/")
					.replace(/^uploads\/+/, "");
				const fullUrl = img.image.filename.startsWith("http")
					? img.image.filename
					: `${API_BASE_URL}/uploads/${relativeUrl}`;
				console.log(
					`[EditPost] Нормалізований URL зображення: ${fullUrl}`
				);
				return { ...img, url: fullUrl };
			}),
		};

		// Перевірка доступності файлів
		for (const img of normalizedAlbum.images) {
			if (!img.url.startsWith("http")) {
				const filePath = path.join(
					uploadDir,
					img.url.replace(/^uploads\//, "")
				);
				try {
					await fs.access(filePath);
					console.log(
						`[EditPost] Файл зображення доступний: ${filePath}`
					);
				} catch {
					console.error(
						`[EditPost] Файл зображення не знайдено: ${filePath}`
					);
					throw new Error(`Зображення не знайдено: ${img.url}`);
				}
			}
		}

		console.log("Пост оновлено, зображення:", normalizedAlbum.images);
		return { status: "success", data: normalizedAlbum as Album };
	} catch (err) {
		console.error("Помилка:", err);

		// Очищення створених файлів
		for (const filename of createdImageUrls) {
			const filePath = path.join(
				__dirname,
				"..",
				"..",
				"public",
				"uploads",
				filename
			);
			console.log(`[EditPost] Видаляємо файл: ${filePath}`);
			await fs
				.unlink(filePath)
				.catch((e) =>
					console.error("[EditPost] Помилка видалення файлу:", e)
				);
		}
		return {
			status: "error",
			message:
				err instanceof Error ? err.message : "Не вдалося оновити пост",
		};
	}
}

async function deleteAlbum(id: number): Promise<IOkWithData<Album> | IError> {
	try {
		const deleteAlbum = await albumRepository.deleteAlbum(id);

		return { status: "success", data: deleteAlbum };
	} catch (error) {
		console.error("Error in deleteAlbum service:", error);
		return {
			status: "error",
			message:
				error instanceof Error
					? error.message
					: "Failed to delete album",
		};
	}
}

const albumService = {
	createAlbum,
	deleteAlbum,
	editAlbum,
	getAlbums,
};

export default albumService;
