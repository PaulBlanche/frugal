import * as esbuild from '../../../dep/esbuild.ts';
import { log } from '../../log.ts';

export function reporter(): esbuild.Plugin {
  return {
    name: 'esbuild:reporter',
    setup(build) {
      build.onEnd(async (result) => {
        const errors = result.errors;
        const warnings = result.warnings;

        for (const error of errors) {
          const formatted = (await esbuild.formatMessages([error], {
            kind: 'error',
            color: true,
            terminalWidth: 100,
          })).join('\n');

          log('error during build', {
            kind: 'error',
            scope: 'esbuild',
            extra: formatted,
          });
        }

        for (const warning of warnings) {
          const formatted = (await esbuild.formatMessages([warning], {
            kind: 'warning',
            color: true,
            terminalWidth: 100,
          })).join('\n');

          log('warning during build', {
            kind: 'warning',
            scope: 'esbuild',
            extra: formatted,
          });
        }
      });
    },
  };
}
