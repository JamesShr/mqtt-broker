import { Injectable } from '@nestjs/common';
import { Client, AuthenticateError } from 'aedes';

export interface MqttConnectAuthService {
  authenticate(
    client: Client,
    username: Readonly<string>,
    password: Readonly<Buffer>,
    done: (err: AuthenticateError | null, success: boolean | null) => void,
  ): Promise<void>;
}

@Injectable()
export class MqttConnectAuthServiceImpl implements MqttConnectAuthService {
  public constructor() {}

  public async authenticate(
    client: Client,
    username: Readonly<string>,
    password: Readonly<Buffer>,
    done: (err: AuthenticateError | null, success: boolean | null) => void,
  ): Promise<void> {
    try {
      done(null, true);
    } catch (err: any) {
      done(this.createMqttAuthError(err.returnCode), null);
    }
  }

  /**
   * 1: Unacceptable protocol version
   * 2: Identifier rejected
   * 3: Server unavailable
   * 4: Bad user name or password
   */
  private createMqttAuthError(returnCode: number): AuthenticateError {
    const error = new Error('Mqtt error.') as AuthenticateError;
    error.returnCode = returnCode;
    return error;
  }
}
