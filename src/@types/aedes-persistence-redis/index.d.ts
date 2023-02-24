declare module 'aedes-persistence-redis' {
  export interface RedisOpts {
    host: string;
    port: number;
    db: number;
  }

  function aedesPersistenceRedis(opts: RedisOpts): any;

  export default aedesPersistenceRedis;
}
