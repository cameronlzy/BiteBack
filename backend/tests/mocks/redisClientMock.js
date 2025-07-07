import RedisMock from 'ioredis-mock';

const redis = new RedisMock();

export const getRedisClient = async () => redis;
