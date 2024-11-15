from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class User(models.Model):
    id = fields.CharField(pk=True, max_length=8)
    username = fields.CharField(max_length=255)
    email = fields.CharField(max_length=255)
    password = fields.CharField(max_length=255)
    email_verified = fields.BooleanField(default=False)  
    # Establishing a many-to-many relationship to Role
    roles = fields.ManyToManyField(
        'myapp.Role',  # This refers to the Role model
        related_name='users',  # This is how Role model will access User
        through='user_roles'  # This is the name of the join table
    )

    class Meta:
        table_name = "users"

# Pydantic model for User, useful for request/response serialization
User_Pydantic = pydantic_model_creator(User, name="User")
UserIn_Pydantic = pydantic_model_creator(User, name="UserIn", exclude_readonly=True)