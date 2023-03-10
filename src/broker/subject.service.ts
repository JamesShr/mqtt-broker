import {
  Injectable,
  Inject,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BrokerService } from './broker.service';
import {
  OnPublishEvent,
  IpClient,
  OnSubscribeEvent,
  OnUnSubscribeEvent,
  SubscribeEvent,
  UnSubscribeEvent,
  SubjectInitOption,
} from './dtos/broker.dto';

export interface SubjectService {
  getPublishSubject(): Subject<OnPublishEvent>;
  getConnectSubject(): Subject<IpClient>;
  getDisconnectSubject(): Subject<IpClient>;
  getSubscribeSubject(): Subject<SubscribeEvent>;
  getUnSubscribeSubject(): Subject<UnSubscribeEvent>;
}

@Injectable()
export class SubjectServiceImpl
  implements SubjectService, OnApplicationBootstrap
{
  private subjectInitOption: SubjectInitOption;
  private readonly publishSubject = new Subject<OnPublishEvent>();
  private readonly connectSubject = new Subject<IpClient>();
  private readonly disconnectSubject = new Subject<IpClient>();
  private readonly subscribeSubject = new Subject<SubscribeEvent>();
  private readonly unsubscribeSubject = new Subject<UnSubscribeEvent>();

  // private readonly logger = new Logger(ReportSubjectServiceImpl.name);

  public constructor(
    options: Partial<SubjectInitOption>,
    private readonly mqttBrokerService: BrokerService,
  ) {
    this.subjectInitOption = Object.assign({}, { topic: /(.+)/ }, options);
  }

  public onApplicationBootstrap(): void {
    // publish
    this.mqttBrokerService
      .createOnPublishObservable((topic) =>
        this.subjectInitOption.topic.test(topic),
      )
      .pipe(
        catchError((err, caught$) => {
          Logger.error(err.stack);
          return caught$;
        }),
      )
      .subscribe(this.publishSubject);

    // disconnect
    this.mqttBrokerService
      .createOnClientDisconnectObservable()
      .pipe(
        map((client: IpClient) => {
          Logger.log(`subject client ${client.id} disconnect`);
          return client;
        }),
        catchError((err, caught$) => {
          Logger.error(err.stack);
          return caught$;
        }),
      )
      .subscribe(this.disconnectSubject);

    // connect
    this.mqttBrokerService
      .createOnClientObservable()
      .pipe(
        map((client: IpClient) => {
          Logger.log(`subject client ${client.ip} ${client.id} connect`);
          return client;
        }),
        catchError((err, caught$) => {
          Logger.error(err.stack);
          return caught$;
        }),
      )
      .subscribe(this.connectSubject);

    //subscribe
    this.mqttBrokerService
      .createOnClientSubscribeTopicObservable()
      .pipe(
        map((data: OnSubscribeEvent) => {
          return {
            client: data.client.id,
            topics: data.subscriptions.map((sub) => {
              return sub.topic;
            }),
          };
        }),
        catchError((err, caught$) => {
          Logger.error(err.stack);
          return caught$;
        }),
      )
      .subscribe(this.subscribeSubject);

    //unsubscribe
    this.mqttBrokerService
      .createOnClientUnSubscribeTopicObservable()
      .pipe(
        map((data: OnUnSubscribeEvent) => {
          return {
            client: data.client.id,
            topics: data.subscriptions.map((sub) => {
              return sub;
            }),
          };
        }),
        catchError((err, caught$) => {
          Logger.error(err.stack);
          return caught$;
        }),
      )
      .subscribe(this.unsubscribeSubject);
  }

  public getPublishSubject(): Subject<OnPublishEvent> {
    return this.publishSubject;
  }

  public getConnectSubject(): Subject<IpClient> {
    return this.connectSubject;
  }

  public getDisconnectSubject(): Subject<IpClient> {
    return this.disconnectSubject;
  }

  public getSubscribeSubject(): Subject<SubscribeEvent> {
    return this.subscribeSubject;
  }

  public getUnSubscribeSubject(): Subject<UnSubscribeEvent> {
    return this.unsubscribeSubject;
  }
}
