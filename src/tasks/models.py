from django.db import models
from authentication.models import User


class Todo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=100)
    created_at = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True , blank=True)
    is_done = models.BooleanField(default=False)

