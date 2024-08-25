import asyncpg
import json
import uuid

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
                    background_color TEXT,
                    services JSONB
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
            
    async def generate_service_id(self):
        # Generate a unique service_id using UUID
        return str(uuid.uuid4())

    async def add_service(self, username: str, service_type: str, documents: dict, notes: str):
        async with self.pool.acquire() as connection:
            try:
                # Fetch the current services for the user
                current_services = await connection.fetchval('''
                    SELECT services FROM accounts WHERE username = $1;
                ''', username)

                # Parse the current services or initialize an empty dictionary if no services exist
                services_dict = json.loads(current_services) if current_services else {}

                # Generate a new service_id
                service_id = await self.generate_service_id()

                # Add the new service to the dictionary
                if service_type not in services_dict:
                    services_dict[service_type] = []

                services_dict[service_type].append({
                    'service_id': service_id,
                    'documents': documents,
                    'notes': notes
                })

                # If no services were found, insert a new record
                if not current_services:
                    await connection.execute('''
                        INSERT INTO accounts (username, services) VALUES ($1, $2)
                        ON CONFLICT (username) DO UPDATE SET services = $2;
                    ''', username, json.dumps(services_dict))
                else:
                    # Update the services column in the database
                    await connection.execute('''
                        UPDATE accounts SET services = $1 WHERE username = $2;
                    ''', json.dumps(services_dict), username)

                return service_id
            except Exception as e:
                print(f"Failed to add service: {e}")
                return None
            
    async def close(self):
        await self.pool.close()