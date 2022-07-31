import * as frugal from '../../dep/frugal/core.ts';
import { Toc } from '../../toc.ts';

export const PATTERN = `/docs:slug(.*)`;

export type Path = frugal.PathObject<typeof PATTERN>;
export type Data = { markup: string; toc: Toc };
