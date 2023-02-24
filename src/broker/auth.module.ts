import { Module } from '@nestjs/common';
import { MqttConnectAuthServiceImpl } from './auth/connect.service';
import { MqttPublishAuthServiceImpl } from './auth/publish.service';
import { MqttSubscribeAuthServiceImpl } from './auth/subscribe.service';

@Module({
  providers: [
    MqttConnectAuthServiceImpl,
    MqttPublishAuthServiceImpl,
    MqttSubscribeAuthServiceImpl,
  ],
  exports: [
    MqttConnectAuthServiceImpl,
    MqttPublishAuthServiceImpl,
    MqttSubscribeAuthServiceImpl,
  ],
})
export class AuthModule { }
