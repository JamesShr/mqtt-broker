# mqtt-broker

- forRoot
```typescript
import { Module } from '@nestjs/common';
import { BrokerModule } from '@jamesshr/mqtt-broker';

@Module({
  imports: [
    BrokerModule.forRoot({
      broker: {
        port: 1884,
        redis: {
          host: 'redis',
          port: 6379,
          password: 'password',
          mqEmitterDb: 15,
          persistenceDb: 15,
        },
        tls: {
          enable: true,
          port: 8883,
          keyPath: 'server_key.pem',
          certPath: 'server_cert.pem',
          caPath: 'CA_cert.pem',
          requestCert: true,
          rejectUnauthorized: true,
        },
        ws: {
          enable: false,
          port: 8083,
        },
      },
      subject:{
        topic:/^\$(thing|gateway)\/(.+)\/\$(data)\/(.+)$/
      }
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

```