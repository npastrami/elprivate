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
                CREATE TABLE IF NOT EXISTS accounts (
                    username VARCHAR(255) PRIMARY KEY,
                    amount INT,
                    wallet_id TEXT,
                    transaction_id TEXT,
                    background_color TEXT
                );
            ''')

    async def update_user_account(self, username: str, new_username: str, new_email: str):
        async with self.pool.acquire() as connection:
            try:
                # Assuming you also have an 'email' field in the 'accounts' table
                await connection.execute('''
                    UPDATE accounts
                    SET username = $1, email = $2
                    WHERE username = $3;
                ''', new_username, new_email, username)
                return True
            except Exception as e:
                print(f"Failed to update account: {e}")
                return False
            
    async def close(self):
        await self.pool.close()