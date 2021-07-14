import { IotcOpcuaClient } from './services';
import { forget } from './utils';

let client: IotcOpcuaClient;

async function start() {
    try {
        client = new IotcOpcuaClient();

        await client.initialize();
        await client.connect();

        await client.createSession();

        // @ts-ignore
        const result = await client.browseServer();

        const idsToWatch = [
            1001,
            1002
        ];
        await client.createSubscription(idsToWatch);
    }
    catch (ex) {
        // tslint:disable-next-line:no-console
        console.log(`['startup', 'error'], 👹 Error starting server: ${ex.message}`);
    }
}

forget(start);
