import NodeCache from "node-cache";
export type CacheProvider<ValueType> = (key: string) => Promise<ValueType>;

export default class DynamicCacheProvider<ValueType> {
    private readonly _cache:NodeCache;
    private readonly _provider:CacheProvider<ValueType>;

    constructor(provider: CacheProvider<ValueType>, options?:NodeCache.Options) {
        this._cache = new NodeCache(options);
        this._provider = provider;
    }

    async get(key: string):Promise<ValueType> {
        let value = this._cache.get(key) as ValueType;

        if(value === undefined) {
            value = await this._provider(key);
        }

        return value;
    }

    set(key:string, value:ValueType, ttl?:number|string):boolean {
        return this._cache.set(key, value, ttl);
    }

    getNodeCache():NodeCache {
        return this._cache;
    }


}