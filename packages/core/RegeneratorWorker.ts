import { RegenerationRequest } from './Regenerator.ts';
import { Frugal } from './Frugal.ts';
import * as log from '../log/mod.ts';

type RegenerateMessage = {
    type: 'regenerate';
    configPath: string;
    request: RegenerationRequest;
};

export type InboundMessage = RegenerateMessage;

type DoneMessage = {
    type: 'done';
    success: boolean;
};

type ErrorMessage = {
    type: 'error';
    error: any;
};

export type OutboundMessage = DoneMessage | ErrorMessage;

function postMessageToWorker(worker: Worker, message: InboundMessage) {
    worker.postMessage(message);
}

function postMessageFromWorker(message: OutboundMessage) {
    self.postMessage(message);
}

function logger() {
    return log.getLogger('frugal:RegeneratorWorker');
}

export async function regenerate(
    request: RegenerationRequest,
    configPath: string,
): Promise<boolean> {
    logger().info({
        op: 'start',
        url: request.url,
        msg() {
            return `${this.op} ${this.logger!.timerStart}`;
        },
        logger: {
            timerStart: `regeneration of ${request.url}`,
        },
    });

    const success = await new Promise<boolean>((resolve, reject) => {
        const worker = new Worker(import.meta.url, {
            type: 'module',
            deno: {
                namespace: true,
            },
        });

        worker.addEventListener(
            'message',
            (message: MessageEvent<OutboundMessage>) => {
                if (message.data.type === 'done') {
                    resolve(message.data.success);
                }
                if (message.data.type === 'error') {
                    reject(message.data.error);
                }
            },
        );

        postMessageToWorker(worker, {
            type: 'regenerate',
            configPath,
            request,
        });
    });

    logger().info({
        op: 'done',
        url: request.url,
        msg() {
            return `${this.logger!.timerEnd} ${this.op}`;
        },
        logger: {
            timerEnd: `regeneration of ${request.url}`,
        },
    });

    return success;
}

self.addEventListener(
    'message',
    async (message: MessageEvent<InboundMessage>) => {
        if (message.data.type === 'regenerate') {
            try {
                const configModule = await import(message.data.configPath);
                const configModuleExports = Object.keys(configModule);
                const frugal = await Frugal.load(
                    configModule[configModuleExports[0]],
                );
                const success = await frugal.handleRegenerate(
                    message.data.request,
                );
                postMessageFromWorker({
                    type: 'done',
                    success,
                } as OutboundMessage);
            } catch (error: any) {
                postMessageFromWorker({
                    type: 'error',
                    error,
                } as OutboundMessage);
            }
        }
    },
);
