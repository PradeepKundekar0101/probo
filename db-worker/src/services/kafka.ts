import { Consumer, Kafka, Producer } from "kafkajs";
import AWS from 'aws-sdk';
import { updateInrBalance, updateStockBalance } from "../controller/balance";

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

let consumer: Consumer | null = null;
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

export async function createConsumer(): Promise<Consumer> {
   if (consumer) return consumer;
   const kafkaInstance = await createKafkaInstance();
   consumer = kafkaInstance.consumer({
      groupId:"default",
   });
   await consumer.connect();
   await consumer.subscribe(
   {
      topic:"MESSAGES",
      fromBeginning:true
   })
   return consumer;
}

export const startConsumeMessages = async () => {
   const consumer = await createConsumer();
   await consumer.run({
      autoCommit:true,
      eachMessage:async({message,pause})=>{
         if(!message){
            return
         } 
         const {operation,data} = JSON.parse(message.value?.toString()!)
         switch(operation ){
            case "UPDATE_INR_BALANCE":
               try {
                  updateInrBalance(data)
                  break;
               } catch (error) {
                  console.log(error)
                  pause()
                  setTimeout(()=>{
                     consumer.resume([{topic:"MESSAGES"}])
                  },60 * 1000)
               }
            case "UPDATE_STOCK_BALANCE":
               try {
                  updateStockBalance(data)
               } catch (error) {
                  console.log(error)
                  pause()
                  setTimeout(()=>{
                     consumer.resume([{topic:"MESSAGES"}])
                  },60 * 1000)
               }
               break;
            case "UPDATE_ORDERBOOK":
               break;
         }
      }
   })
};
