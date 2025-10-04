// import { Module } from '@nestjs/common';
// import { ChatService } from './chat.service';
// import { ChatGateway } from './chat.gateway';

// @Module({
//   providers: [ChatService, ChatGateway]
// })
// export class ChatModule {}
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [UsersModule, JwtModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}