import { parse } from '../../dep/std/flags.ts';
import * as path from '../../dep/std/path.ts';
import * as colors from '../../dep/std/colors.ts';
import { AssertionError } from '../../dep/std/asserts.ts';
import { FrugalBuilder, FrugalWatcher } from './Frugal.ts';
import { FrugalError } from './FrugalError.ts';
import { config } from '../../dep/std/dotenv.ts';

config({ safe: true, export: true });

const HEADER = `Frugal CLI`;

const MAIN_HELP = `${HEADER}

USAGE:
    frugal [SUBCOMMAND] [OPTIONS]

SUBCOMMANDS:
    build
            build the project
    watch
            run a watcher, building the project on each change
    refresh [PATHNAMES]
            refresh a set of pages in the project

OPTIONS:
    -p, --project
            path to the project config (default to frugal.config.ts)
`;

const BUILD_HELP = `${HEADER}, subcommand BUILD
build a frugal project

USAGE:
    frugal build [OPTIONS]

OPTIONS:
    -p, --project
            path to the project config (default to frugal.config.ts)
`;

const REFRESH_HELP = `${HEADER}, subcommand REFRESH
refresh a set of pages in the project, without building any assets.

USAGE:
    frugal refresh <PATHNAMES> [OPTIONS]

ARGS:
    <PATHNAMES>
            a comma separated list of pathnames to refresh

OPTIONS:
    -p, --project
            path to the project config (default to frugal.config.ts)
`;

const WATCH_HELP = `${HEADER}, subcommand WATCH
refresh a set of pages in the project, without building any assets.

USAGE:
    frugal watch <PATHNAMES> [OPTIONS]

ARGS:
    <PATHNAMES>
            a comma separated list of additionnal pathnames not in module graph to watch 

OPTIONS:
    -p, --project
            path to the project config (default to frugal.config.ts)
`;

if (import.meta.main) {
    try {
        await main();
    } catch (error: unknown) {
        if (
            error instanceof AssertionError || error instanceof FrugalError
        ) {
            console.error(`${colors.red('Error')} : ${error.message}`);
        } else {
            console.error(error);
        }
        Deno.exit();
    }
}

type Args = {
    _: (string | number)[];
    project: string;
    help: boolean;
    watch: string | boolean;
};

async function main() {
    const command = Deno.args[0];
    const args = parse(Deno.args, {
        alias: {
            'project': 'p',
            'help': 'h',
        },
        string: ['project'],
        boolean: ['help'],
        default: {
            'project': './frugal.config.ts',
        },
    }) as Args;

    switch (command) {
        case 'build': {
            return await build(args);
        }
        case 'watch': {
            const argPathnames = Deno.args[1];
            const pathnames = argPathnames !== undefined
                ? argPathnames.split(',')
                : [];
            return await watch(pathnames, args);
        }
        case 'refresh': {
            const argPathnames = Deno.args[1];
            const pathnames = argPathnames !== undefined
                ? argPathnames.split(',')
                : [];
            return await refresh(pathnames, args);
        }
        default: {
            console.log(MAIN_HELP);
            Deno.exit();
        }
    }
}

async function watch(pathnames: string[], args: Args) {
    if (args.help) {
        console.log(WATCH_HELP);
        Deno.exit();
    }

    console.log(commandLog('watch', args, {
        pathnames: pathnames.join(', '),
    }));

    const builder = await getFrugalBuilder(args);
    const watcher = new FrugalWatcher(builder);
    await watcher.watch(pathnames);
}

async function build(args: Args) {
    if (args.help) {
        console.log(BUILD_HELP);
        Deno.exit();
    }

    console.log(commandLog('build', args));

    const builder = await getFrugalBuilder(args);
    const instance = await builder.create();
    await instance.build();
}

async function refresh(pathnames: string[], args: Args) {
    if (args.help) {
        console.log(REFRESH_HELP);
        Deno.exit();
    }

    console.log(commandLog('refresh', args, {
        pathnames: pathnames.join(', '),
    }));

    const builder = await getFrugalBuilder(args);
    const instance = await builder.load();
    await Promise.all(pathnames.map(async (pathname) => {
        await instance.refresh(pathname);
    }));
}

async function getFrugalBuilder(args: Args) {
    const { config } = await import(path.resolve(args.project));
    return new FrugalBuilder(config);
}

function commandLog(
    command: string,
    args: Args,
    extra: Record<string, string> = {},
) {
    const extraString = Object.entries(extra).filter(([_, value]) =>
        Boolean(value)
    )
        .map((
            [key, value],
        ) => `${key}: ${value}`).join('\n');

    return `${HEADER}
command: ${command}
project: ${args.project}${extraString !== '' ? `\n${extraString}` : ''}`;
}
