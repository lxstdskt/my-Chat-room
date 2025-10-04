"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let ChatGateway = class ChatGateway {
    logger = new common_1.Logger('SimpleChat');
    server;
    users = new Map();
    async handleConnection(client) {
        try {
            console.log('客户端连接信息:', client.handshake.auth);
            const userInfo = client.handshake.auth.user;
            console.log('接收到的用户信息:', userInfo);
            let userId;
            let username;
            if (userInfo && userInfo.id && userInfo.username) {
                userId = userInfo.id.toString();
                username = userInfo.username;
                console.log('使用真实用户信息:', { userId, username });
            }
            else {
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
            console.log('当前在线用户:', Array.from(this.users.values()));
            this.server.emit('user_online', {
                userId: userData.userId,
                username: userData.username,
                message: `${userData.username} 加入了聊天室`
            });
            const onlineUsersList = Array.from(this.users.values()).map(u => ({
                id: u.userId,
                username: u.username
            }));
            console.log('发送在线用户列表给所有用户:', onlineUsersList);
            this.server.emit('online_users', {
                users: onlineUsersList
            });
        }
        catch (error) {
            this.logger.error('连接处理失败:', error);
            const userId = `user_${Date.now()}`;
            const username = `用户${Math.floor(Math.random() * 1000)}`;
            this.users.set(client.id, { userId, username });
            this.logger.log(`${username} 连接成功（降级模式）`);
        }
    }
    handleDisconnect(client) {
        const user = this.users.get(client.id);
        if (user) {
            this.users.delete(client.id);
            this.server.emit('user_offline', {
                userId: user.userId,
                username: user.username,
                message: `${user.username} 离开了聊天室`
            });
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
    handleMessage(client, data) {
        const user = this.users.get(client.id);
        if (user) {
            this.logger.log(`${user.username} 发送: ${data.content}`);
            const messageData = {
                fromUserId: user.userId,
                username: user.username,
                content: data.content,
                timestamp: new Date(),
                isOwn: false
            };
            console.log('准备广播消息给所有用户:', messageData);
            this.server.emit('new_private_message', messageData);
            console.log('消息广播完成');
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_private_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map