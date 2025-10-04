// src/gateways/chat.gateway.ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway(8080, { cors: { origin: '*' } }) // 使用不同端口避免冲突
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('SimpleChat');
  @WebSocketServer() server: Server;
  private users = new Map();

  handleConnection(client: Socket) {
    const userId = `user_${Date.now()}`;
    const username = `用户${Math.floor(Math.random() * 1000)}`;
    
    this.users.set(client.id, { userId, username });
    this.logger.log(`${username} 连接成功`);
    
    // 广播用户上线
    this.server.emit('user_online', { userId, username });
    
    // 发送在线用户列表
    client.emit('online_users', { 
      users: Array.from(this.users.values()).map(u => ({ id: u.userId, username: u.username }))
    });
  }

  handleDisconnect(client: Socket) {
    const user = this.users.get(client.id);
    if (user) {
      this.users.delete(client.id);
      this.server.emit('user_offline', { userId: user.userId, username: user.username });
      this.logger.log(`${user.username} 断开连接`);
    }
  }

  @SubscribeMessage('send_message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { content: string }) {
    const user = this.users.get(client.id);
    if (user) {
      this.logger.log(`${user.username} 发送: ${data.content}`);
      this.server.emit('new_message', {
        fromUserId: user.userId,
        username: user.username,
        content: data.content,
        timestamp: new Date()
      });
    }
  }
}