import * as aedes from 'aedes';

declare module 'aedes' {
  export interface Client {
    data: ClientData;
  }

  export interface Aedes {
    clients: {
      [key: string]: Client;
    };
  }

  export type ClientType = 'thing' | 'app';

  export type AuthType = 'properietary' | 'sparkplug';

  export interface ClientData {
    clientType: ClientType;
    authType: AuthType;
    isEon?: boolean;
    orgId?: string;
    thingId?: string;
    appId?: string;
  }
}

export = aedes;
