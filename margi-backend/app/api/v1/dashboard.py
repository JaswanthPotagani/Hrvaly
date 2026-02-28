from app.core.redis import redis_client
import json

@router.get("/stats")
async def get_dashboard_stats(current_user: models.User = Depends(get_current_user),db:Session = Depends(base.get_db)):

    cache_key =f"dash_stats:{current_user.id}"
    cached_data = await redis_client.get(cache_key)
    if cached_data:
        return json.loads(cached_data)

    app_count = db.query(models.JobApplication).filter(models.JobApplication.userId == current_user.id).count()
    
    
    stats = {"total_applications":app_count}
    await redis_client.setex(cache_key,300,json.dumps(stats))
    return stats
    