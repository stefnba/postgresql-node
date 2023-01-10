import dotenv from 'dotenv';

dotenv.config();

export const connection = {
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    max: 30
};

export type UserModel = {
    id: number;
    name: string;
    email: string;
    rank: number;
};

export function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}
