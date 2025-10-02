// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class UsersService {}
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userData: { username: string; password: string }) {
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(userData.username);
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    return this.prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      }, // 不返回密码字段
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}