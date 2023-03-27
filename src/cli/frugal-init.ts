import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import { parse } from '../../dep/std/flags.ts';

const flags = parse(Deno.args, {
    boolean: ['help', 'force', 'only-cli'],
    alias: {
        help: 'h',
        force: 'f',
    },
    default: {
        'only-cli': undefined,
        force: undefined,
        help: false,
    },
});

const HELP = `frugal-init

Initialize a frugal project, by creating all necessary files for a new project
and some utilities.

USAGE:
    frugal-init <DIRECTORY>

OPTIONS:
    --force, -f     Overwrite existing files
    --help, -h      print this message
    --only-cli      Only ouputs cli files
`;

const CONFIRM_FORCE_MESSAGE =
    'The target directory is not empty, some files might be overwritten. Do you want to continue anyway?';

if (flags.help) {
    console.log(HELP);
    Deno.exit(0);
}

if (flags._.length !== 1) {
    console.log(HELP);
    Deno.exit(1);
}

const root = path.resolve(Deno.args[0]);

if (!isDirEmpty(root)) {
    if (flags.force === false || flags.force === undefined && !confirm(CONFIRM_FORCE_MESSAGE)) {
        Deno.exit(1);
    }
}

const tasks = [
    createFromTemplate(root, 'cli/dev.ts', 'dev.ts.template'),
    createFromTemplate(root, 'cli/build.ts', 'build.ts.template'),
    createFromTemplate(root, 'cli/serve.ts', 'serve.ts.template'),
    createFromTemplate(root, 'cli/entrypoint.ts', 'entrypoint.ts.template'),
];

if (!flags['only-cli']) {
    tasks.push(
        createImportMap(root),
        createDenoConfig(root),
        createDotenv(root),
        createDotenvExemple(root),
        createGitignore(root),
        createFromTemplate(root, 'frugal.config.ts', 'frugal.config.ts.template'),
    );
}

await Promise.all(tasks);

function isDirEmpty(root: string) {
    try {
        const dirContent = [...Deno.readDirSync(root)];
        const isEmpty = dirContent.length === 0 ||
            dirContent.length === 1 && dirContent[0].name === '.git';
        return isEmpty;
    } catch (err) {
        if (!(err instanceof Deno.errors.NotFound)) {
            throw err;
        }
        return true;
    }
}

async function createDotenv(root: string) {
    const dotenvPath = path.resolve(root, '.env');
    await fs.ensureFile(dotenvPath);
    await Deno.writeTextFile(dotenvPath, '');
}

async function createDotenvExemple(root: string) {
    const dotenvExemplePath = path.resolve(root, '.env.exemple');
    await fs.ensureFile(dotenvExemplePath);
    await Deno.writeTextFile(dotenvExemplePath, '');
}

async function createGitignore(root: string) {
    const content = '.env';

    const gitIgnorePath = path.resolve(root, '.gitignore');
    await fs.ensureFile(gitIgnorePath);
    await Deno.writeTextFile(gitIgnorePath, content);
}

async function createImportMap(root: string) {
    const importMap = {
        imports: {
            frugal: new URL('../../', import.meta.url),
        },
    };

    const importMapPath = path.resolve(root, 'import_map.json');
    await fs.ensureFile(importMapPath);
    await Deno.writeTextFile(importMapPath, JSON.stringify(importMap, null, 2));
}

async function createDenoConfig(root: string) {
    const denoConfig = {
        importMap: './import_map.json',
        tasks: {
            dev: 'deno run -A --unstable cli/dev.ts',
        },
    };

    const denoConfigPath = path.resolve(root, 'deno.json');
    await fs.ensureFile(denoConfigPath);
    await Deno.writeTextFile(denoConfigPath, JSON.stringify(denoConfig, null, 2));
}

async function createFromTemplate(root: string, name: string, template: string) {
    const dotenvAbsoluteURL = new URL(import.meta.resolve('../../dep/std/dotenv.ts'));
    const dotenvPath = dotenvAbsoluteURL.protocol === 'file:'
        ? path.relative(root, path.fromFileUrl(dotenvAbsoluteURL))
        : dotenvAbsoluteURL.href;
    const content = (await Deno.readTextFile(new URL(template, import.meta.url)))
        .replaceAll('%%dotenv%%', dotenvPath);

    const filePath = path.resolve(root, name);
    await fs.ensureFile(filePath);
    await Deno.writeTextFile(filePath, content);
}
