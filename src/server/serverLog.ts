import * as path from '../../dep/std/path.ts';
import * as http from '../../dep/std/http.ts';
import * as XX64 from '../../dep/xxhash.ts';

import { Log, log } from '../log.ts';

type RequestIdentifier = {
  remoteHostname: string;
  method: string;
  url: string;
  hash: string;
};

export async function identifier(
  request: Request,
  connInfo: http.ConnInfo,
): Promise<RequestIdentifier> {
  const url = path.posix.normalize(
    decodeURIComponent(new URL(request.url).pathname),
  );

  const remoteHostname = getHostname(connInfo) ?? '???';
  const method = request.method;

  const hash = ((await XX64.create())
    .update(url)
    .update(remoteHostname)
    .update(method)
    .update(String(Date.now()))
    .digest('hex') as string).slice(0, 7);

  return { url, remoteHostname, method, hash };
}

function getHostname(connInfo: http.ConnInfo): string | undefined {
  const remotAddr = connInfo.remoteAddr;
  if (remotAddr.transport === 'tcp' || remotAddr.transport === 'udp') {
    return remotAddr.hostname;
  }
  return undefined;
}

export function identifiedLog(identifier: RequestIdentifier): Log {
  return (messageOrError, config) => {
    if (messageOrError instanceof Error) {
      log(messageOrError, { ...config, scopeExtra: identifier.hash });
    } else {
      log(messageOrError, {
        ...config,
        scopeExtra: identifier.hash,
      });
    }
  };
}
