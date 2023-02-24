# mqtt-broker package

## Introduction

<p>
  This Module can init MQTT Broker base on Aedes , and export some mqtt event subject and managment MQTT clients function witch was packaged.  
<p>

<p>
In broker authenticate . I also apply default service witch it never verify. Of course, it can also be designed and repackaged into a new dynamic module at business logic repository.
</p>

---

## Guide

- config

```
{
  broker: {
    port: 1883, // mqtt port
    redis: {
      host: 'redis', // redis host
      port: 6379, // redis port 
      password: 'password', // redis password
      mqEmitterDb: 15, // redis db use for mq emitter 
      persistenceDb: 15, // redis db use for persistence
    },
    tls: {
      enable: false, // enable mqtts
      port: 8883, // mqtts port
      keyPath: 'server_key.pem', // ssl key path
      certPath: 'server_cert.pem', // ssl cert path 
      caPath: 'ca_cert.pem', // ssl cert path
      requestCert: true, // check mqtt client cert for two way verify
      rejectUnauthorized: true, // reject Unauthorized , default false
    },
    ws: {
      enable: false, // enable mqtt web socket 
      port: 8083, // mqtt web socket port
    },
  },
  subject:{
    topic:/^\$(thing|gateway)\/(.+)\/\$(data)\/(.+)$/ // filter topic for mqtt publish event
  }
}
```

- forRoot ( use for NestJs)

```typescript
import { Module } from '@nestjs/common';
import { BrokerModule } from '@jamesshr/mqtt-broker';

@Module({
  imports: [
    BrokerModule.forRoot({
      broker: {
        port: 1883,
        redis: {
          host: 'redis',
          port: 6379,
          password: 'password',
          mqEmitterDb: 15,
          persistenceDb: 15,
        },
        tls: {
          enable: false,
          port: 8883,
          keyPath: 'server_key.pem',
          certPath: 'server_cert.pem',
          caPath: 'ca_cert.pem',
          requestCert: true,
          rejectUnauthorized: true,
        },
        ws: {
          enable: false,
          port: 8083,
        },
      },
      subject: {
        topic: /^\$(device)\/(.+)\/\$(data)\/(.+)$/,
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```
