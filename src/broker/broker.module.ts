import { DynamicModule, Module } from '@nestjs/common';
import { BrokerServiceImpl, AedesInitOption, BrokerService } from './broker.service'
import { MqttConnectAuthServiceImpl, MqttConnectAuthService } from './auth/connect.service';
import { MqttPublishAuthServiceImpl, MqttPublishAuthService } from './auth/publish.service';
import { MqttSubscribeAuthServiceImpl, MqttSubscribeAuthService } from './auth/subscribe.service';
import { AuthModule } from './auth.module';
import { SubjectService, SubjectServiceImpl, SubjectInitOption } from './subject.service';

const brokerServiceFactory = (
  options: Partial<AedesInitOption>,
) => {
  return {
    provide: BrokerServiceImpl,
    useFactory: (
      connectAuth: MqttConnectAuthService,
      publishAuth: MqttPublishAuthService,
      subscribeAuth: MqttSubscribeAuthService,
    ) => {
      return new BrokerServiceImpl(options, connectAuth, publishAuth, subscribeAuth);
    },
    inject: [
      MqttConnectAuthServiceImpl,
      MqttPublishAuthServiceImpl,
      MqttSubscribeAuthServiceImpl
    ],
  }
};

const subjectServiceFactory = (
  options: Partial<SubjectInitOption>,
) => {
  return {
    provide: SubjectServiceImpl,
    useFactory: (
      brokerService: BrokerService,
    ) => {
      return new SubjectServiceImpl(options, brokerService);
    },
    inject: [
      BrokerServiceImpl
    ],
  }
}

@Module({
  imports: [AuthModule]
})
export class BrokerModule {
  static forRoot(
    options: {
      broker?: Partial<AedesInitOption>,
      subject?: Partial<SubjectInitOption>,
    }
  ): DynamicModule {
    const providers = [
      brokerServiceFactory(options ? options.broker : {}),
      subjectServiceFactory(options ? options.subject : {}),
    ];
    return {
      providers: providers,
      exports: providers,
      module: BrokerModule,
    };
  }
}