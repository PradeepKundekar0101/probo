import {redis} from ".."
export async function pushToQueue(endpoint:string, data:any, res:any) {
    try {
      const message = { endpoint, data };
      await redis.lpush('messageQueue', JSON.stringify(message)); 
      res.status(200).send({ status: 'Message queued successfully!' });
    } catch (error) {
      console.error('Error queuing message:', error);
      res.status(500).send({ status: 'Error queuing message' });
    }
  }