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
    handleConnection(client) {
        const userId = `user_${Date.now()}`;
        const username = `用户${Math.floor(Math.random() * 1000)}`;
        this.users.set(client.id, { userId, username });
        this.logger.log(`${username} 连接成功`);
        this.server.emit('user_online', { userId, username });
        client.emit('online_users', {
            users: Array.from(this.users.values()).map(u => ({ id: u.userId, username: u.username }))
        });
    }
    handleDisconnect(client) {
        const user = this.users.get(client.id);
        if (user) {
            this.users.delete(client.id);
            this.server.emit('user_offline', { userId: user.userId, username: user.username });
            this.logger.log(`${user.username} 断开连接`);
        }
    }
    handleMessage(client, data) {
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
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(8080, { cors: { origin: '*' } })
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map