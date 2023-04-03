
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("api/profile/<str:author_id>", views.user_profile_api, name="user_profile_api"),
    path("api/follow/<str:user_followed_id>", views.follow_api_user_id, name="follow_api_user_id"),
    path("api/following_page", views.following_page_api, name="following_page_api"),
    path("api/posts", views.posts_api, name="posts_api"),
    path("api/posts/<str:id>", views.posts_api_id, name="posts_api_id"),
    path("api/posts/liked/<str:post_id>", views.liked_posts_api_id, name="liked_posts_api_id"),
    path("api/posts/delete/<str:post_id>", views.delete_posts_api_id, name="delete_posts_api_id"),
]
