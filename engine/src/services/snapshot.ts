import AWS from "aws-sdk";

interface Configuration {
    region: string;
    bucket: string;
    accessId: string;
    secretAccessKey: string;
    interval: number;
    data: any;
}


export class SnapShotManager {
    private s3: AWS.S3;
    private bucket: string;
    private intervalId?: NodeJS.Timer;
    private readonly interval: number;
    private readonly snapShotPrefix: string;
    private data: Object;
    private readonly maxSnapshots: number = 3; 

    constructor(config: Configuration) {
        const awsConfig = {
            region: config.region || process.env.AWS_REGION,
            credentials: {
                accessKeyId: config.accessId || process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY
            }
        };

        // Validate required credentials
        if (!awsConfig.credentials.accessKeyId || !awsConfig.credentials.secretAccessKey) {
            throw new Error('AWS credentials are required. Please provide them via configuration or environment variables.');
        }
        //@ts-ignore
        this.s3 = new AWS.S3(awsConfig);
        this.bucket = config.bucket || process.env.AWS_BUCKET || '';
        
        if (!this.bucket) {
            throw new Error('S3 bucket name is required');
        }

        this.interval = config.interval;
        this.snapShotPrefix = 'snapshots/';
        this.data = config.data;
    }

    public startSnapShotting = (): void => {
        if (this.intervalId) {
            console.log('Snapshot interval already running');
            return;
        }


        this.createSnapShot()
            .then(() => console.log('Initial snapshot created'))
            .catch(err => console.error('Failed to create initial snapshot:', err));


        this.intervalId = setInterval(() => {
            this.createSnapShot()
                .catch(err => console.error('Failed to create snapshot:', err));
        }, this.interval);
    };

    public createSnapShot = async (): Promise<void> => {
        const timestamp = new Date().toISOString();
        const key = `${this.snapShotPrefix}snapshot-${timestamp}.json`;
        
        try {
            await this.s3.putObject({
                Bucket: this.bucket,
                Key: key,
                Body: JSON.stringify({
                    timestamp,
                    version: "1.0",
                    data: this.data
                }),
                ContentType: "application/json"
            }).promise();

            await this.cleanupOldSnapshots();

            await this.s3.putObject({
                Bucket: this.bucket,
                Key: `${this.snapShotPrefix}latest.json`,
                Body: JSON.stringify({ latestSnapshot: key }),
                ContentType: "application/json"
            }).promise();
            
            console.log(`Snapshot created successfully: ${key}`);
        } catch (error) {
            console.error('Error creating snapshot:', error);
            throw error;
        }
    };

    private cleanupOldSnapshots = async (): Promise<void> => {
        try {
            const response = await this.s3.listObjects({
                Bucket: this.bucket,
                Prefix: this.snapShotPrefix
            }).promise();

            if (!response.Contents) return;


            const snapshots = response.Contents
                .filter(obj => obj.Key && obj.Key.endsWith('.json') && !obj.Key.endsWith('latest.json'))
                .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));


            const snapshotsToDelete = snapshots.slice(this.maxSnapshots);
            
            for (const snapshot of snapshotsToDelete) {
                if (snapshot.Key) {
                    await this.s3.deleteObject({
                        Bucket: this.bucket,
                        Key: snapshot.Key
                    }).promise();
                    console.log(`Deleted old snapshot: ${snapshot.Key}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old snapshots:', error);
        }
    };

    public recoverLatestData = async (): Promise<any> => {
        try {
            const latestPointer = await this.s3.getObject({
                Bucket: this.bucket,
                Key: `${this.snapShotPrefix}latest.json`
            }).promise();

            const { latestSnapshot } = JSON.parse(latestPointer.Body?.toString() || '{}');

            if (!latestSnapshot) {
                throw new Error('No latest snapshot pointer found');
            }


            const data = await this.s3.getObject({
                Bucket: this.bucket,
                Key: latestSnapshot
            }).promise();

            return JSON.parse(data.Body?.toString() || '{}');
        } catch (error) {
            console.error('Error recovering latest data:', error);
            throw error;
        }
    };

    public stopSnapShotting = (): void => {
        if (this.intervalId) {
            clearInterval(this.intervalId as NodeJS.Timeout);
            this.intervalId = undefined;
            console.log('Snapshot interval stopped');
        }
    };
}