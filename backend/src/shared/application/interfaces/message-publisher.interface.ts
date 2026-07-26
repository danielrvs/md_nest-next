export const MESSAGE_PUBLISHER_INTERFACE = Symbol('MessagePublisherInterface');

export interface MessagePublisherInterface {
    publishEvent<T>(routingKey: string, payload: T): Promise<void>;
}