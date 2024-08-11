import asyncpg
import json

class TableBuilder:
    async def __aenter__(self):
        self.conn = await asyncpg.connect(
            database="dapdatabase",
            user="postgres",
            password="newpassword",
            host="localhost",
            port="5432"
        )
        return self

    async def fetch_client_data(self, client_id):
        records = await self.conn.fetch("SELECT * FROM client_docs WHERE client_id = $1;", client_id)

        client_docs_data = [dict(record) for record in records]

        final_data = {
            'client_docs': client_docs_data,
        }

        return json.dumps(final_data)

    async def __aexit__(self, exc_type, exc, tb):
        await self.conn.close()