import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway( { cors: { origin: '*' } }) 
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('SimpleChat');
  @WebSocketServer() server: Server;
  private users = new Map();

  async handleConnection(client: Socket) {
    try {
      // 调试：打印所有认证信息
      console.log('客户端连接信息:', client.handshake.auth);
      
      // 从客户端传递的用户信息中获取用户名
      const userInfo = client.handshake.auth.user;
      console.log('接收到的用户信息:', userInfo);
      
      let userId: string;
      let username: string;

      if (userInfo && userInfo.id && userInfo.username) {
        // 使用前端传递的真实用户信息
        userId = userInfo.id.toString();
        username = userInfo.username;
        console.log('使用真实用户信息:', { userId, username });
      } else {
        // 如果没有用户信息，使用随机生成
        userId = `user_${Date.now()}`;
        username = `用户${Math.floor(Math.random() * 1000)}`;
        console.log('使用随机用户信息:', { userId, username });
      }

      const userData = {
        userId: userId,
        username: username,
        clientId: client.id
      };

      this.users.set(client.id, userData);
      this.logger.log(`${username} 连接成功`);

      // 调试：打印当前在线用户
      console.log('当前在线用户:', Array.from(this.users.values()));

      // 修复：广播用户上线给所有用户（包括自己）
      this.server.emit('user_online', { 
        userId: userData.userId, 
        username: userData.username,
        message: `${userData.username} 加入了聊天室`
      });

      // 修复：发送在线用户列表给所有用户
      const onlineUsersList = Array.from(this.users.values()).map(u => ({
        id: u.userId,
        username: u.username
      }));
      
      console.log('发送在线用户列表给所有用户:', onlineUsersList);
      this.server.emit('online_users', { 
        users: onlineUsersList
      });

    } catch (error) {
      this.logger.error('连接处理失败:', error);
      // 降级处理
      const userId = `user_${Date.now()}`;
      const username = `用户${Math.floor(Math.random() * 1000)}`;
      
      this.users.set(client.id, { userId, username });
      this.logger.log(`${username} 连接成功（降级模式）`);
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.users.get(client.id);
    if (user) {
      this.users.delete(client.id);
      
      // 修复：广播用户下线给所有用户
      this.server.emit('user_offline', { 
        userId: user.userId, 
        username: user.username,
        message: `${user.username} 离开了聊天室`
      });
      
      // 修复：同时更新在线用户列表给所有用户
      const onlineUsersList = Array.from(this.users.values()).map(u => ({
        id: u.userId,
        username: u.username
      }));
      
      this.server.emit('online_users', { 
        users: onlineUsersList
      });
      
      this.logger.log(`${user.username} 断开连接`);
    }
  }

  @SubscribeMessage('send_private_message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { content: string }) {
    const user = this.users.get(client.id);
    if (user) {
      this.logger.log(`${user.username} 发送: ${data.content}`);
      
      // 创建消息对象
      const messageData = {
        fromUserId: user.userId,
        username: user.username,
        content: data.content,
        timestamp: new Date(),
        isOwn: false
      };
      
      console.log('准备广播消息给所有用户:', messageData);
      
      // 修复：广播给所有用户（包括发送者）
      this.server.emit('new_private_message', messageData);
      
      console.log('消息广播完成');
    }
  }
}