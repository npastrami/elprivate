
TORTOISE_ORM = {
    "connections": {
        "default": {
            "engine": "tortoise.backends.asyncpg",
            "credentials": {
                "host": "localhost",
                "port": "5432",
                "user": "postgres",
                "password": "newpassword",
                "database": "accountdatabase",
            },
        },
    },
    "apps": {
        "myapp": {
            "models": ["accounts.models.user_model", "accounts.models.role_model"],
            "default_connection": "default",
        },
    },
}