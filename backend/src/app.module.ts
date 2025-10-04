// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';

// @Module({
//   imports: [AuthModule, UsersModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { GatewaysModule } from './gateways/gateways.module'; // 添加这一行

@Module({
  imports: [
    AuthModule, 
    UsersModule, 
    PrismaModule, 
    ChatModule,
    GatewaysModule // 添加这一行
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
