import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationBootstrap,
} from '@nestjs/common';
import aedes, {
  Aedes,
  Client,
  Subscription,
  AedesOptions,
} from 'aedes';
import { Observable, fromEvent, Subject } from 'rxjs';
import { map, filter, mergeMap, toArray } from 'rxjs/operators';
import { createServer } from 'aedes-server-factory';
import { protocolDecoder } from 'aedes-protocol-decoder';
import { ISubscription, IPublishPacket } from 'mqtt-packet';
import mqemitter from 'mqemitter-redis';
import aedesPersistenceRedis from 'aedes-persistence-redis';
import { readFileSync } from 'fs';
import { MqttConnectAuthService } from './auth/connect.service';
import { MqttPublishAuthService } from './auth/publish.service';
import { MqttSubscribeAuthService } from './auth/subscribe.service';

export type AedesInitOption = {
  port: number;
  tls?: {
    enable: boolean;
    port: number;
    certPath: string;
    keyPath: string;
    caPath: string;
    requestCert: boolean;
    rejectUnauthorized: boolean;
  };
  ws?: {
    enable: boolean;
    port: number;
  };
  redis?: {
    host: string;
    port: number;
    password: string;
    mqEmitterDb: number;
    persistenceDb: number;
  };
};

export interface IpClient extends Client {
  ip: string;
  eventAt: Date;
}

export type PublishPacket = {
  topic: string;
  payload: string | Buffer;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
};

export type OnSubscribeEvent = {
  client: IpClient;
  subscriptions: Subscription[];
};

export type OnUnSubscribeEvent = {
  client: IpClient;
  subscriptions: string[];
};

export type OnPublishEvent = {
  client: IpClient;
  packet: IPublishPacket;
};

export type TopicFilter = (topic: string) => boolean;

export type Report = {
  character: string;
  id: string;
  topic: string;
  payload: { [key: string]: number | string | null }[];
  timestamp: number;
};
export type SubscribeEvent = {
  client: string;
  topics: string[];
};

export type UnSubscribeEvent = {
  client: string;
  topics: string[];
};

export interface BrokerService {
  getAedesInstance(): Aedes;
  publish(packet: PublishPacket): Promise<void>;
  checkConnect(clientId: string): Promise<boolean>;
  getConnectClientList(): Promise<string[]>;
  closeClientConnect(clientId: string): Promise<void>;

  // observable
  createOnPublishObservable(
    topicFilter: TopicFilter,
  ): Observable<OnPublishEvent>;
  createOnClientObservable(): Observable<IpClient>;
  createOnClientDisconnectObservable(): Observable<IpClient>;
  createOnClientSubscribeTopicObservable(): Observable<OnSubscribeEvent>;
  createOnClientUnSubscribeTopicObservable(): Observable<OnUnSubscribeEvent>;
}

export const BROKER_SERVICE = Symbol('BROKER_SERVICE');

@Injectable()
export class BrokerServiceImpl
  implements BrokerService, OnModuleInit, OnApplicationBootstrap {
  private aedesInstance: Aedes & AedesOptions;
  private aedesInitOption: AedesInitOption;

  public constructor(
    options: Partial<AedesInitOption>,
    private readonly mqttConnectAuthService: MqttConnectAuthService,
    private readonly mqttPublishAuthService: MqttPublishAuthService,
    private readonly mqttSubscribeAuthService: MqttSubscribeAuthService
  ) {
    this.aedesInitOption = Object.assign(
      {},
      { port: 1883 },
      options
    );
  }

  public async onModuleInit(): Promise<void> {
    const aedesConfig: AedesOptions = {
      authenticate: this.mqttConnectAuthService.authenticate.bind(
        this.mqttConnectAuthService,
      ),
      authorizePublish: this.mqttPublishAuthService.authorizePublish.bind(
        this.mqttPublishAuthService,
      ),
      authorizeSubscribe: this.mqttSubscribeAuthService.authorizeSubscribe.bind(
        this.mqttSubscribeAuthService,
      ),
      preConnect: (client: any, packet, done) => {
        if (client.connDetails && client.connDetails.ipAddress) {
          client.ip = client.connDetails.ipAddress.split(':')[3];
        }
        client.eventAt = new Date();
        return done(null, true);
      },
    };
    if (this.aedesInitOption.redis) {
      Logger.debug(`MQTT set mq ->${this.aedesInitOption.redis.mqEmitterDb} and persistence ->${this.aedesInitOption.redis.mqEmitterDb} by redis ${this.aedesInitOption.redis.host}:${this.aedesInitOption.redis.port}`)
      aedesConfig.mq = mqemitter({
        host: this.aedesInitOption.redis.host,
        port: this.aedesInitOption.redis.port,
        db: this.aedesInitOption.redis.mqEmitterDb,
        ...(this.aedesInitOption.redis.password ? { password: this.aedesInitOption.redis.password } : {}),
      })
      aedesConfig.persistence = aedesPersistenceRedis({
        host: this.aedesInitOption.redis.host,
        port: this.aedesInitOption.redis.port,
        db: this.aedesInitOption.redis.mqEmitterDb,
        ...(this.aedesInitOption.redis.password ? { password: this.aedesInitOption.redis.password } : {}),
      })
    }
    this.aedesInstance = aedes(aedesConfig);
  }

  public onApplicationBootstrap(): void {
    createServer(this.aedesInstance, {
      trustProxy: true,
      protocolDecoder,
    }).listen(this.aedesInitOption.port, () => {
      Logger.debug(`MQTT Broker is listening on port ${this.aedesInitOption.port}`)
    });

    if (this.aedesInitOption.tls && this.aedesInitOption.tls.enable) {
      createServer(this.aedesInstance, {
        tls: {
          key: readFileSync(this.aedesInitOption.tls.keyPath),
          cert: readFileSync(this.aedesInitOption.tls.certPath),
          ca: readFileSync(this.aedesInitOption.tls.caPath),
          requestCert: this.aedesInitOption.tls.requestCert,
          rejectUnauthorized: this.aedesInitOption.tls.rejectUnauthorized,
        },
      }).listen(this.aedesInitOption.tls.port, () => {
        Logger.debug(`MQTTs broker is listening on ${this.aedesInitOption.tls.port} port.`)
      });
    }

    if (this.aedesInitOption.ws && this.aedesInitOption.ws.enable) {
      createServer(this.aedesInstance, { ws: true }).listen(
        this.aedesInitOption.ws.port,
        () => {
          Logger.debug(`MQTT websocket is listening on ${this.aedesInitOption.ws.port} port.`);
        },
      );
    }
  }

  public getAedesInstance(): Aedes {
    return this.aedesInstance;
  }

  public async publish(packet: PublishPacket): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        this.aedesInstance.publish(
          {
            ...packet,
            cmd: 'publish',
            ...(typeof packet.dup === 'undefined'
              ? { dup: false }
              : { dup: packet.dup }),
            ...(typeof packet.retain === 'undefined'
              ? { retain: false }
              : { retain: packet.retain }),
            ...(typeof packet.qos === 'undefined'
              ? { qos: 0 }
              : { qos: packet.qos }),
          },
          (err) => {
            if (err) return reject(err);
            return resolve();
          },
        );
      });
    } catch (error) {
      Logger.verbose(error);
    }
  }

  public async checkConnect(clientId: string): Promise<boolean> {
    const client = this.aedesInstance.clients[clientId];
    if (client) {
      return true;
    }
    return false;
  }

  public async closeClientConnect(clientId: string): Promise<void> {
    const client = this.aedesInstance.clients[clientId];
    if (client) {
      client.close();
      Logger.debug(`close ${clientId} connect`);
    }
  }

  public async getConnectClientList(): Promise<string[]> {
    try {
      return Object.keys(this.aedesInstance.clients);
    } catch (error) {
      return [];
    }
  }

  public createOnPublishObservable(
    topicFilter: TopicFilter,
  ): Observable<OnPublishEvent> {
    try {
      return fromEvent(this.aedesInstance, 'publish').pipe(
        map((event) => ({
          packet: event[0],
          client: event[1],
        })),
        filter(({ packet }) => topicFilter(packet.topic)),
      );
    } catch (error) {
    }
  }

  public createOnClientObservable(): Observable<IpClient> {
    try {
      return fromEvent(
        this.aedesInstance,
        'clientReady',
        (client: IpClient) => client,
      );
    } catch (error) {
      Logger.log(error);
    }
  }

  public createOnClientDisconnectObservable(): Observable<IpClient> {
    try {
      return fromEvent(
        this.aedesInstance,
        'clientDisconnect',
        (client: IpClient) => client,
      );
    } catch (error) {
      Logger.log(error);
    }
  }

  public createOnClientSubscribeTopicObservable(): Observable<OnSubscribeEvent> {
    try {
      return fromEvent(this.aedesInstance, 'subscribe').pipe(
        map((event) => ({
          subscriptions: event[0],
          client: event[1],
        })),
      );
    } catch (error) {
      Logger.log(error);
    }
  }

  public createOnClientUnSubscribeTopicObservable(): Observable<OnUnSubscribeEvent> {
    try {
      return fromEvent(this.aedesInstance, 'unsubscribe').pipe(
        map((event) => ({
          subscriptions: event[0],
          client: event[1],
        })),
      );
    } catch (error) {
      Logger.log(error);
    }
  }
}
