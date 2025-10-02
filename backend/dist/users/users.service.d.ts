import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userData: {
        username: string;
        password: string;
    }): Promise<{
        id: number;
        username: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByUsername(username: string): Promise<{
        id: number;
        username: string;
        password: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: number): Promise<{
        id: number;
        username: string;
        avatar: string | null;
        createdAt: Date;
    } | null>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
