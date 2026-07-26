export const DISTRIBUTED_LOCK_SERVICE_INTERFACE = Symbol('DistributedLockServiceInterface')

export interface DistributedLockServiceInterface {
    lock<T>(key: string, ttl: number, callback: () => Promise<T>): Promise<T>;
}