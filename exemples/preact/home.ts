import * as preact from '../../runtime/preact.server.ts';
import { HomePage } from './HomePage.tsx';

export const self = import.meta.url;

export const pattern = '/';

export const getContent = preact.getContentFrom(HomePage);
