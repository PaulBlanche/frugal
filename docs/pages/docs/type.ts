import { Toc } from './toc.ts';

export const PATTERN = `/docs:slug(.*)`;

export type Data = { markup: string; toc: Toc };
