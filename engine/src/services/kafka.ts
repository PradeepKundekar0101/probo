import { Kafka, Producer } from "kafkajs";
import AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: process.env.AWS_REGION! });

async function getCaCertFromS3(bucketName: string, objectKey: string): Promise<string> {
   try {
      const data = await s3.getObject({
         Bucket: bucketName,
         Key: objectKey
      }).promise();

      if (data.Body) {
         return data.Body.toString('utf-8');  
      } else {
         throw new Error("No data found in the S3 object.");
      }
   } catch (error) {
      console.error("Error retrieving CA certificate from S3:", error);
      throw error;
   }
}

let producer: Producer | null = null;
let kafka: Kafka | null = null;

async function createKafkaInstance(): Promise<Kafka> {
   if (kafka) return kafka;

   const bucketName = process.env.BUCKET_NAME!;
   const objectKey = "ca.pem";
   const caCert = await getCaCertFromS3(bucketName, objectKey);

   kafka = new Kafka({
      brokers: [process.env.KAFKA_SERVICE_URI!],
      ssl: {
         ca: [caCert]
      },
      sasl: {
         username: process.env.KAFKA_USER!,
         password: process.env.KAFKA_PASSWORD!,
         mechanism: "plain"
      }
   });
   return kafka;
}

export async function createProducer(): Promise<Producer> {
   const kafkaInstance = await createKafkaInstance();
   producer = kafkaInstance.producer();
   await producer.connect();
   console.log("Kafka Producer created")
   return producer;
}

export const produceMessage = async (message: string) => {
   if(!producer){
      producer = await createProducer();
   }
   await producer.send({
      topic: "MESSAGES",
      messages: [{ key: `message-${Date.now()}`, value: message }]
   });
};
