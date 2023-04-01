import { Persistence } from './Persistence.ts';
import { log } from '../log.ts';

export class UpstashPersistence implements Persistence {
  #url: string;
  #token: string;

  constructor(url: string, token: string) {
    this.#url = url;
    this.#token = token;
  }

  async set(key: string | [string, string], content: string) {
    const command = Array.isArray(key)
      ? ['hset', key[0], key[1], content]
      : ['set', key, content];

    const response = await this.#sendCommand(command);

    if (response.status !== 200) {
      const body = await response.json();
      throw new Error(body.error);
    }
  }

  async get(key: string | [string, string]) {
    const command = Array.isArray(key)
      ? ['hget', key[0], key[1]]
      : ['get', key];

    const response = await this.#sendCommand(command);
    const body = await response.json();
    if (response.status !== 200) {
      throw new Error(body.error);
    }
    if (body.result === null) {
      return undefined;
    }
    return body.result;
  }

  async delete(key: string | [string, string]) {
    const command = Array.isArray(key)
      ? ['hdel', key[0], key[1]]
      : ['del', key];

    const response = await this.#sendCommand(command);
    if (response.status !== 200) {
      const body = await response.json();
      throw new Error(body.error);
    }
  }

  async expire(key: string, time: number) {
    const command = ['EXPIREAT', key, time];

    const response = await this.#sendCommand(command);
    if (response.status !== 200) {
      const body = await response.json();
      throw new Error(body.error);
    }
  }

  async #sendCommand(command: (string | number)[]) {
    log(`Send upstash command "${command.join(' ')}"`, {
      scope: 'UpstashPersistence',
      kind: 'verbose',
    });
    return await fetch(
      this.#url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      },
    );
  }
}
