import { Image } from './../postApp/types';
import { IError, IOkWithData } from "../types/types";
import { hash, compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { SECRET_KEY } from "../config/token";
import userRepository from "./userRepository";
import { Avatar, CreateUser, CreateUser1, ICreateUser, IUpdateUser, UpdateUser, UpdateUserPromise, User } from "./types";
import nodemailer from 'nodemailer';
import path from "path";
import fs from "fs/promises";
import { API_BASE_URL } from '..';

const emailCodes = new Map<string, { code: string, expiresAt: number }>()

async function getUserById(id: number): Promise<IOkWithData<User> | IError> {
  try {
    const user = await userRepository.getUserById(id);
    if (!user) {
      return { status: "error", message: "User not found" };
    }

    return { status: "success", data: user };
  } catch (err) {
    if (err instanceof Error) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "Internal server error" };
  }
}

async function login(email: string, password: string): Promise<IOkWithData<string> | IError> {
  try {
    const user = await userRepository.findUserByUsername(email);

    if (!user) {
      return { status: "error", message: "User not found" };
    }
    if (typeof user === "string") {
      return { status: "error", message: user };
    }
    if (password !== user.password) {
      return { status: "error", message: "Passwords didn`t match" };
    }


    const token = sign({ id: user.id }, SECRET_KEY, { expiresIn: "7d" });

    return { status: "success", data: token };
  } catch (err) {
    if (err instanceof Error) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "Internal server error" };
  }
}

async function registration(userData: ICreateUser): Promise<IOkWithData<string> | IError> {
  try {

    const user = await userRepository.findUserByUsername(userData.username);
    if (user) {
      return { status: "error", message: "User already exists" };
    }

    // const hashedPassword = await hash(userData.password, 10);

    // const hashedUserData = {
    //   ...userData,
    //   password: hashedPassword,
    // };


    const newData: CreateUser1 = {
      date_of_birth: new Date,
      auth_user: {
        create: {
          password: userData.password,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          is_active: true,
          is_staff: false,
          date_joined: new Date,
          is_superuser: false
        }

      }
      ,
      // avatar: [{
      //   image: "uploads/user.png",
      //   active: true,
      //   shown: true,
      //   profile_id: userData.id,
      //   id: userData.id
      // }]
    }

    const newUser = await userRepository.createUser(newData);

    if (!newUser) {
      return { status: "error", message: "User is not created" };
    }


    const token = sign({ id: newUser.id.toString() }, SECRET_KEY, { expiresIn: "1d" });

    return { status: "success", data: token };

  } catch (err) {
    if (err instanceof Error) {
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "An unknown error occurred" };
  }
}



async function sendEmail(email: string) {

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;


  emailCodes.set(email, { code, expiresAt });


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'honcharovstallker@gmail.com',
      pass: 'qxja qfuk urdy qihr'
    }
  });


  const mailOptions = {
    from: 'chitchatbyteam1@gmail.com',
    to: email,
    subject: 'Код подтверждения',
    text: code
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Письмо отправлено:', info.response);
    return { success: true, code };
  } catch (err) {
    console.error('Ошибка отправки:', err);
    return { status: "error", message: "Не удалось отправить письмо" };
  }
}


function verifyCode(email: string, userInputCode: string) {
  const storedData = emailCodes.get(email);

  if (!storedData) {
    return { success: false, error: 'Код не найден или устарел' };
  }

  const { code, expiresAt } = storedData;

  if (Date.now() > expiresAt) {
    emailCodes.delete(email);
    console.log(emailCodes)
    return { success: false, error: 'Код истёк' };
  }


  if (userInputCode !== code) {
    return { success: false, error: 'Неверный код' };
  }

  emailCodes.delete(email);
  return { success: true };
}

function saveCode(email: string, code: string) {
  console.log(email + " bebebebeb")
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  emailCodes.set(normalizedEmail, { code, expiresAt });
}

async function updateUserById(data: IUpdateUser, id: number): Promise<IOkWithData<User> | IError> {
  const createdImageFilename: string[] = [];
  try {
    const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");

    await fs.mkdir(uploadDir, { recursive: true });

    let updateData = { ...data };

    // updateData.avatar?.connect

    if (updateData.avatar && Array.isArray(updateData.avatar)) {
      for (const imageObj of updateData.avatar) {
        if (typeof imageObj.image === "string" && imageObj.image.startsWith("data:image")) {
          const matches = imageObj.image.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches) {
            return { status: "error", message: "Невірний формат base64 зображення" };
          }

          const [, ext, base64Data] = matches;
          const allowedFormats = ["jpeg", "png", "gif"];
          const maxSizeInBytes = 5 * 1024 * 1024;

          if (!allowedFormats.includes(ext.toLowerCase())) {
            return { status: "error", message: `Непідтримуваний формат зображення: ${ext}` };
          }

          const buffer = Buffer.from(base64Data, "base64");
          if (buffer.length > maxSizeInBytes) {
            return { status: "error", message: `Зображення занадто велике: максимум 5 MB` };
          }

          const filename = `${Date.now()}-${Math.round(Math.random() * 1000000)}.${ext}`;
          const filePath = path.join(uploadDir, filename);

          await fs.writeFile(filePath, buffer);

          try {
            await fs.access(filePath);
            imageObj.image = `uploads/${filename}`;
          } catch {
            return { status: "error", message: "Не вдалося зберегти зображення" };
          }
        }
      }
    }

    const user = await userRepository.updateUserById(updateData, id);

    if (!user) {
      for (const filename of createdImageFilename) {
        await fs.unlink(path.join(uploadDir, filename)).catch(() => { });
      }
      return { status: "error", message: "User doesn't update" };
    }

    if (user.avatar && !user.avatar.map((image) => image.image.startsWith("http"))) {
      const relativeUrl = user.avatar.map((image) => image.image.replace(/^uploads\/+/, "").replace(/\\/g, "/"));
      const correctImageuser: Avatar[] = []

      user.avatar.forEach((image) => {
        correctImageuser.push({
          id: image.id,
          image: `${API_BASE_URL}/uploads/${relativeUrl}`,
          active: image.active,
          shown: image.shown,
          profile_id: image.profile_id
        });
      });
      user.avatar = correctImageuser
    }

    return { status: "success", data: user };
  } catch (err) {

    for (const filename of createdImageFilename) {
      await fs.unlink(path.join(__dirname, "..", "..", "public", "uploads", filename)).catch(() => { });
    }

    return { status: "error", message: "Internal server error" };
  }
}

async function getUsers(): Promise<IOkWithData<User[]> | IError> {
  const users = await userRepository.getUsers();

  if (!users) {
    return { status: 'error', message: 'No users found' };
  }

  return { status: 'success', data: users };
}

const userService = {
  login,
  registration,
  getUserById,
  sendEmail,
  verifyCode,
  saveCode,
  updateUserById,
  getUsers
};

export default userService;