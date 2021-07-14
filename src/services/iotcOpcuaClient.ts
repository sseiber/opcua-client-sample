import {
    OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    ClientSession,
    AttributeIds,
    ClientMonitoredItem,
    ClientSubscription,
    DataValue,
    MonitoringParametersOptions,
    ReadValueIdOptions,
    TimestampsToReturn,
    DataType,
    WriteValueOptions,
    NodeId,
    NodeIdType
} from 'node-opcua';

export class IotcOpcuaClient {
    private client: OPCUAClient;
    private session: ClientSession;

    public log(tags: any, message: any) {
        const tagsMessage = (tags && Array.isArray(tags)) ? `[${tags.join(', ')}]` : '[]';

        // tslint:disable-next-line:no-console
        console.log(`[${new Date().toTimeString()}] [${tagsMessage}] ${message}`);
    }

    public async initialize(): Promise<void> {
        this.log(['IotcOpcuaClient', 'info'], `Instantiating opcua client`);

        // this.client = new OPCUAClient();
    }

    public async connect(): Promise<void> {
        const options = {
            applicationName: 'Woodshop',
            connectionStrategy: {
                initialDelay: 1000,
                maxRetry: 1
            },
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            endpointMustExist: false
        };

        this.client = OPCUAClient.create(options);

        await this.client.connect('opc.tcp://Scotts-MBPro16.local:4334/UA/Factory_001');
    }

    public async createSession(): Promise<void> {
        this.session = await this.client.createSession();
    }

    public async browseServer(): Promise<any> {
        const browseResult = await this.session.browse('RootFolder');
        for (const reference of browseResult.references) {
            this.log(['IotcOpcuaClient', 'info'], `  -> ${reference.browseName.toString()}`);
        }

        // const browseResult2 = await this.session.browse({
        //     nodeId: new NodeId(NodeIdType.NUMERIC, 2253, 0),
        //     nodeClassMask: NodeClass.Variable,
        //     resultMask: 63
        // });

        return browseResult;
    }

    public async readValue(nodeId: string): Promise<any> {
        const dataValue2 = await this.session.read({
            nodeId,
            attributeId: AttributeIds.Value
        });

        return dataValue2;
    }

    public async writeValue(nodeId: number, dataType: DataType, newValue: any): Promise<void> {
        this.log(['IotcOpcuaClient', 'info'], `Write value: ${newValue}`);

        const writeOptions: WriteValueOptions = {
            nodeId: new NodeId(NodeIdType.NUMERIC, nodeId, 1),
            attributeId: AttributeIds.Value,
            value: {
                value: {
                    dataType,
                    value: newValue
                }
            }
        };

        await this.session.write(writeOptions);
    }

    public async createSubscription(idsToWatch: number[]): Promise<void> {
        const subscription = ClientSubscription.create(this.session, {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 10 * 60 * 10,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 2,
            publishingEnabled: true,
            priority: 6
        });

        subscription
            .on('started', () => {
                this.log(['IotcOpcuaClient', 'info'], `subscription started for 2 seconds - subscriptionId=${subscription.subscriptionId}`);
            })
            .on('keepalive', () => {
                this.log(['IotcOpcuaClient', 'info'], `keepalive`);
            })
            .on('terminated', () => {
                this.log(['IotcOpcuaClient', 'info'], `terminated`);
            });

        for (const id of idsToWatch) {
            const nodeId = new NodeId(NodeIdType.NUMERIC, id, 1);
            const itemToMonitor: ReadValueIdOptions = {
                nodeId,
                attributeId: AttributeIds.Value
            };

            const parameters: MonitoringParametersOptions = {
                samplingInterval: 10,
                discardOldest: true,
                queueSize: 1
            };

            const monitoredItem = ClientMonitoredItem.create(
                subscription,
                itemToMonitor,
                parameters,
                TimestampsToReturn.Both
            );

            monitoredItem.on('changed', (dataValue: DataValue) => {
                this.log(['IotcOpcuaClient', 'info'], ` value has changed : ${dataValue.value}`);
            });
        }

        await new Promise((resolve) => {
            setTimeout(() => {
                return resolve('');
            }, 15 * 1000);
        });

        this.log(['IotcOpcuaClient', 'info'], `Terminating subscription`);

        await subscription.terminate();
    }
}
