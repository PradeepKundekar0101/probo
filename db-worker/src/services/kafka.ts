import { Consumer, Kafka, KafkaConfig } from "kafkajs";
import AWS from "aws-sdk";
import { updateInrBalance, updateStockBalance } from "../controller/balance";
import { handleUpdateTradersCount } from "../controller/market";

const s3 = new AWS.S3({ region: process.env.AWS_REGION! });

interface KafkaMessage {
  message: {
    operation:
      | "UPDATE_INR_BALANCE"
      | "UPDATE_STOCK_BALANCE"
      | "UPDATE_ORDERBOOK"
      | "UPDATE_TRADER_COUNT";
    data: any;
  };
}

const RETRY_INTERVAL = 60 * 1000;
const MAX_RETRIES = 5;
const RECONNECT_TIMEOUT = 5000;

let kafka: Kafka | null = null;
let consumer: Consumer | null = null;
let retryCount = 0;
let isReconnecting = false;

async function getCaCertFromS3(
  bucketName: string,
  objectKey: string
): Promise<string> {
  try {
    const data = await s3
      .getObject({
        Bucket: bucketName,
        Key: objectKey,
      })
      .promise();

    if (!data.Body) {
      throw new Error("No data found in the S3 object.");
    }
    return data.Body.toString("utf-8");
  } catch (error) {
    console.error("Error retrieving CA certificate from S3:", error);
    throw error;
  }
}

async function createKafkaConfig(): Promise<KafkaConfig> {
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) throw new Error("BUCKET_NAME environment variable not set");

  const caCert = await getCaCertFromS3(bucketName, "ca.pem");

  return {
    clientId: "db-worker",
    brokers: [process.env.KAFKA_SERVICE_URI!],
    ssl: {
      ca: [caCert],
      rejectUnauthorized: true,
    },
    sasl: {
      username: process.env.KAFKA_USER!,
      password: process.env.KAFKA_PASSWORD!,
      mechanism: "plain",
    },
    retry: {
      initialRetryTime: 1000,
      retries: 10,
    },
  };
}

async function createKafkaInstance(): Promise<Kafka> {
  if (kafka) return kafka;
  const config = await createKafkaConfig();
  kafka = new Kafka(config);
  return kafka;
}

async function processMessage(
  operation: string,
  data: any,
  pause: () => void
): Promise<void> {
  try {
    switch (operation) {
      case "UPDATE_TRADER_COUNT":
        handleUpdateTradersCount(data)
        break;
      case "UPDATE_INR_BALANCE":
        await updateInrBalance(data);
        break;
      case "UPDATE_STOCK_BALANCE":
        await updateStockBalance(data);
        break;
      case "UPDATE_ORDERBOOK":
        break;
      default:
      // console.warn(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Error processing message (${operation}):`, error);
    pause();
    setTimeout(() => {
      if (consumer) {
        consumer.resume([{ topic: "MESSAGES" }]);
      }
    }, RETRY_INTERVAL);
    throw error;
  }
}

async function reconnect(): Promise<void> {
  try {
    if (consumer) {
      await consumer.disconnect();
    }
    consumer = null;
    kafka = null;
    await startConsuming();
  } catch (error) {
    throw error;
  }
}

async function handleConnectionError(error: Error): Promise<void> {
  console.error("Kafka connection error:", error);

  if (retryCount >= MAX_RETRIES) {
    console.error("Max retries reached. Exiting process.");
    process.exit(1);
  }

  if (!isReconnecting) {
    isReconnecting = true;
    retryCount++;

    console.log(`Attempting to reconnect (${retryCount}/${MAX_RETRIES})...`);

    setTimeout(async () => {
      try {
        await reconnect();
        isReconnecting = false;
        retryCount = 0;
      } catch (error) {
        isReconnecting = false;
        await handleConnectionError(error as Error);
      }
    }, RECONNECT_TIMEOUT);
  }
}

export async function startConsuming(): Promise<void> {
  try {
    const kafkaInstance = await createKafkaInstance();
    consumer = kafkaInstance.consumer({ groupId: "default" });

    consumer.on("consumer.disconnect", async () => {
      console.warn("Consumer disconnected");
      await handleConnectionError(new Error("Consumer disconnected"));
    });

    await consumer.connect();
    await consumer.subscribe({
      topic: "MESSAGES",
      fromBeginning: true,
    });

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ message, pause }) => {
        if (!message?.value) {
          console.log("Received empty message");
          return;
        }

        try {
          const payload: KafkaMessage = JSON.parse(message.value.toString());
          console.log(payload);
          await processMessage(
            payload.message.operation,
            payload.message.data,
            pause
          );
        } catch (error) {
          console.error("Error processing message:", error);
          pause();
          setTimeout(() => {
            if (consumer) {
              consumer.resume([{ topic: "MESSAGES" }]);
            }
          }, RETRY_INTERVAL);
        }
      },
    });

    console.log("Kafka consumer started successfully");
  } catch (error) {
    await handleConnectionError(error as Error);
  }
}
