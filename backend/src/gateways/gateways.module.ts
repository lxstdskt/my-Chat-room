// src/gateways/gateways.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewaysModule {}