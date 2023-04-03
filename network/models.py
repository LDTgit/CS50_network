from django.contrib.auth.models import AbstractUser
from django.db import models
import json
from json import JSONEncoder
import datetime
# from rest_framework import serializers


class User(AbstractUser):
    pass

class Post(models.Model):
    id = models.AutoField(primary_key=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='author')
    text = models.CharField(max_length=280)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True)
    likes = models.ManyToManyField(User, default=None, blank=True, related_name="likes")

    def __str__(self):
        return '{} added a new post at {}'.format(self.author, self.created_at)    
    
    
    def serialize(self):
        return {
            "id": self.id,
            "author": self.author.username,
            "author_id":self.author.id,
            "text": self.text,
            "created_at": self.created_at.strftime("%b %d %Y, %I:%M %p"),
            "updated_at": self.updated_at.strftime("%b %d %Y, %I:%M %p"),
            "likes": [user.username for user in self.likes.all()],
        }

    class Meta:
        verbose_name_plural = "Posts"
    
    def number_of_likes(self):
        return self.likes.count()

class Follow(models.Model):
    id = models.AutoField(primary_key=True)
    user_followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_followed")
    user_following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_following')

    def __str__(self):
        return '{} followed {}'.format(self.user_following, self.user_followed)    

    class Meta:
        verbose_name_plural = "Followers"

    def serialize(self):
        return {
            "id": self.id,
            "user_followed": self.user_followed,
            "user_following": self.user_following,
        }
