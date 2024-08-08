import asyncpg

async def create_pool():
    return await asyncpg.create_pool(
        user='postgres',
        password='newpassword',
        database='accountdatabase',
        host="127.0.0.1",
        port=5432, # Default PostgreSQL port
        max_size=500,
        min_size=0,
        max_query_size=30000,
        max_inactive_connection_lifetime=10,
    )