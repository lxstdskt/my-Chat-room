// src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';
import { showToast } from 'vant';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();

// src/services/socket.service.ts
connect(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 从 localStorage 获取用户信息
      const userStr = localStorage.getItem('user');
      let user = null;
      
      if (userStr) {
        try {
          user = JSON.parse(userStr);
          console.log('WebSocket连接使用的用户信息', user);
        } catch (e) {
          console.error('解析用户信息失败:', e);
        }
      }

      this.socket = io('http://localhost:3000', {
        auth: {
          token: token,
          user: user  // 传递用户信息到后端
        },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO 连接成功，用户信息:', user);
        resolve(true);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO 连接断开:', reason);
        showToast('连接已断开');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO 连接错误:', error);
        showToast('连接服务器失败');
        resolve(false);
      });

      // 注册默认的消息处理器
      this.setupDefaultHandlers();

    } catch (error) {
      console.error('Socket.IO 连接失败:', error);
      resolve(false);
    }
  });
}

  private setupDefaultHandlers() {
    if (!this.socket) return;

    // 自动调用注册的消息处理器
    this.socket.onAny((event, data) => {
      console.log(`收到 Socket.IO 事件: ${event}`, data);
      const handlers = this.messageHandlers.get(event) || [];
      handlers.forEach(handler => handler(data));
    });
  }

  // 发送消息
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  // 发送聊天消息 - 使用正确的事件名称
  sendChatMessage(content: string) {
    return this.emit('send_private_message', { 
      content
    });
  }

  // 新增通用发送消息方法
  sendMessage(event: string, data: any): boolean {
    return this.emit(event, data);
  }

  // 注册消息处理器
  on(event: string, handler: Function) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  // 移除消息处理器
  off(event: string, handler: Function) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageHandlers.clear();
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();