declare module 'mqemitter-redis' {
  export interface RedisOpts {
    host: string;
    port: number;
    db: number;
  }

  function mqemitter(opts: RedisOpts): any;

  export default mqemitter;
}
