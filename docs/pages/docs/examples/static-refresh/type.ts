import { Phase } from '../../../../dep/frugal/core.ts';
import { Toc } from '../../toc.ts';

export type Data = {
    toc: Toc;
    phase: Phase;
    serverNow: Date;
};
