import asyncpg

class AccountDatabase:
    def __init__(self, user, password, database, host):
        self.user = user
        self.password = password
        self.database = database
        self.host = host
        self.pool = None

    async def create_pool(self):
        self.pool = await asyncpg.create_pool(
            user=self.user,
            password=self.password,
            database=self.database,
            host=self.host
        )
        await self.setup_db()

    async def setup_db(self):
        async with self.pool.acquire() as connection:
            await connection.execute('''
                CREATE TABLE IF NOT EXISTS jackpot_10min (
                    username VARCHAR(255) PRIMARY KEY,
                    amount INT,
                    wallet_id TEXT,
                    transaction_id TEXT,
                    background_color TEXT
                );
            ''')
    
    async def create_entry(self, username, amount):
        async with self.pool.acquire() as connection:
            # Step 1: Check if the username already exists and find the highest suffix
            records = await connection.fetch('''
                SELECT username FROM jackpot_10min WHERE username LIKE $1 || '%'
            ''', username)

            if not records:
                # If no records, this is the first entry for this username
                new_username = username
            else:
                # Extract suffix numbers and determine the next available suffix
                suffixes = [int(r['username'].split('#')[-1]) for r in records if r['username'].split('#')[-1].isdigit()]
                next_suffix = max(suffixes) + 1 if suffixes else 1
                new_username = f"{username}#{next_suffix}"

            # Step 3: Insert the new entry with the modified username
            await connection.execute('''
                INSERT INTO jackpot_10min (username, amount, wallet_id, transaction_id, background_color)
                VALUES ($1, $2, NULL, NULL, NULL);
            ''', new_username, amount)

    async def close(self):
        await self.pool.close()