/*import { readLines } from 'https://deno.land/std@0.136.0/io/mod.ts';

listen();

sendMessage({ type: 'ready' });

async function listen() {
    for await (const line of readLines(Deno.stdin)) {
        const message = JSON.parse(line);
        //console.log('recieved message (subprocess)', message);
        switch (message.type) {
            case 'build':
                await new Promise((res) => setTimeout(res, 1000));
                sendMessage({ type: 'done' });
        }
    }
}

function sendMessage(message: any) {
    //console.log('sending message (subprocess)', message);
    Deno.stdout.write(
        new TextEncoder().encode(JSON.stringify(message) + '\n'),
    );
}
*/

import { BackgroundService } from './process/BackgroundService.ts';

const service = new BackgroundService<
    { type: 'build' },
    { type: 'done' }
>();

service.addEventListener('message', async (event) => {
    switch (event.message.type) {
        case 'build':
            console.log('start build');
            await new Promise((res) => setTimeout(res, 1000));
            console.log('build done');
            service.sendMessage({ type: 'done' });
    }
});

service.start();
