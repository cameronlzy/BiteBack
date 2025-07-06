import { createClient } from 'redis';
import config from 'config';

let redisClient;
let isConnected = false;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: config.get('redis.url'),
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    isConnected = true;
  } else if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
  }

  return redisClient;
}
