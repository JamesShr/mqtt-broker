import { Client, Subscription } from 'aedes';
import { IPublishPacket } from 'mqtt-packet';

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
    password?: string;
    mqEmitterDb: number;
    persistenceDb: number;
  };
};

export type SubjectInitOption = {
  topic: RegExp;
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

export type Payload = { [key: string]: number | string | null };

export type Report = {
  character: string;
  id: string;
  topic: string;
  payload: Payload[];
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

