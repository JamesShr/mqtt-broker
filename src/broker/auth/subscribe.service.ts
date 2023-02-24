import { Injectable } from '@nestjs/common';
import { Client } from 'aedes';
import { ISubscription } from 'mqtt-packet';

export interface MqttSubscribeAuthService {
  authorizeSubscribe(
    client: Client,
    sub: ISubscription,
    done: (err?: Error | null, sub?: ISubscription | null) => void,
  ): Promise<void>;
}

@Injectable()
export class MqttSubscribeAuthServiceImpl implements MqttSubscribeAuthService {
  public constructor() {}

  public async authorizeSubscribe(
    client: Client,
    sub: ISubscription,
    done: (err?: Error | null, sub?: ISubscription | null) => void,
  ): Promise<void> {
    done(null, sub);
  }
}
