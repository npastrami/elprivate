from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator

class Role(models.Model):
    id = fields.IntField(pk=True)  # pk=True denotes it as the primary key
    name = fields.CharField(max_length=255)

    class Meta:
        table_name = "roles"

# Pydantic model for Role, useful for request/response serialization
Role_Pydantic = pydantic_model_creator(Role, name="Role")
RoleIn_Pydantic = pydantic_model_creator(Role, name="RoleIn", exclude_readonly=True)