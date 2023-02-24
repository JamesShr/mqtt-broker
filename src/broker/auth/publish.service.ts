import { Injectable } from '@nestjs/common';
import { Client } from 'aedes';
import { IPublishPacket } from 'mqtt-packet';

export interface MqttPublishAuthService {
  authorizePublish(
    client: Client,
    packet: IPublishPacket,
    done: (err?: Error | null) => void,
  ): Promise<void>;
}

@Injectable()
export class MqttPublishAuthServiceImpl implements MqttPublishAuthService {
  public constructor() { }

  public async authorizePublish(
    client: Client,
    packet: IPublishPacket,
    done: (err?: Error | null) => void,
  ): Promise<void> {
    done(null);
  }
}
