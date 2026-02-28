import redis.asyncio as redis
import os
import time

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def is_rate_limited(key: str, limit: int, window: int) -> bool:
    """
    Check if a user has exceeded a request limit within a time window.
    """
    current_time = int(time.time())
    pipe = redis_client.pipeline()

    key = f"rate_limit:{key}"
    await pipe.zremrangebyscore(key, 0, current_time - window)
    await pipe.zadd(key, {str(current_time): current_time})
    await pipe.zcard(key)
    await pipe.expire(key, window)

    results = await pipe.execute()
    request_count = results[2]
    return request_count > limit
 


