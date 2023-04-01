import * as path from '../../dep/std/path.ts';

const command = Deno.args[0];

switch (command) {
  case 'init': {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        path.fromFileUrl(new URL('./frugal-init.ts', import.meta.url)),
        ...Deno.args.slice(1),
      ],
    });
    const process = command.spawn();
    await process.status;
    break;
  }
  case 'create-key': {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '-A',
        path.fromFileUrl(new URL('./frugal-create-key.ts', import.meta.url)),
        ...Deno.args.slice(1),
      ],
    });
    const process = command.spawn();
    await process.status;
    break;
  }
  default: {
    console.error(`Unknown command "${command}"`);
    Deno.exit(1);
  }
}
