// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class ChatService {}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 这里后面会添加消息持久化等方法
  async saveMessage(messageData: any) {
    // 暂时留空，后面实现
  }
}