import * as preact from '../../runtime/preact.server.ts';
import { CounterPage } from './CounterPage.tsx';

export const self = import.meta.url;

export const pattern = '/counter';

export const getContent = preact.getContentFrom(CounterPage);
