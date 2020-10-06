import { IotcOpcuaClient } from './services';
import { forget } from './utils';

let client: IotcOpcuaClient;

async function start() {
    try {
        client = new IotcOpcuaClient();

        await client.initialize();
        await client.connect();

        await client.createSession();

        const result = await client.browseServer();

        idsToWatch = [
            1001,
            1002
        ];
        await client.createSubscription();
    }
    catch (ex) {
        // tslint:disable-next-line:no-console
        console.log(`['startup', 'error'], 👹 Error starting server: ${ex.message}`);
    }
}

forget(start);
