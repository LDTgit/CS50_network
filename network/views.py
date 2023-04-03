import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, Http404, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.core.paginator import Paginator
from django.views.decorators.csrf import csrf_exempt
import math
from .models import User, Post, Follow


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def following_page_api(request):
    current_user = request.user
    following = Follow.objects.filter(user_following=current_user).all()
    following_list = []
    for followed_user in following:
        following_list.append(followed_user.user_followed)
    followed_posts = Post.objects.filter(author__in=following_list).order_by("-created_at").all()
    if request.method == 'GET':
        posts = followed_posts
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        response = {
            "posts": list(post.serialize() for post in page_obj.object_list),
            "page": page_number,
            "total": math.ceil(len(posts) / 10),
            "current_user": current_user.username,
            "is_authenticated": request.user.is_authenticated
        }
        return JsonResponse(response, safe=False)
    else:
        return JsonResponse({
            "error": "GET request required."
        }, status=400)


@csrf_exempt
def posts_api(request):
    if request.method == 'GET':
        posts = Post.objects.order_by("-created_at").all()
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        current_user = request.user.username
        response = {
            "posts": list(post.serialize() for post in page_obj.object_list),
            "page": page_number,
            "total": math.ceil(len(posts) / 10),
            "current_user": current_user,
            "is_authenticated": request.user.is_authenticated
        }
        return JsonResponse(response, safe=False)
    elif (request.method == "POST" and request.user.is_authenticated):
        text = json.loads(request.body)['text']
        author = request.user
        try:
            post_item = Post.objects.create(author=author, text=text)
            post_item.save()
        except IntegrityError as ex:
            print(ex)
            return HttpResponse(status=400)
        return HttpResponse(status=201)


@csrf_exempt
def posts_api_id(request, id):
    try:
        post = Post.objects.get(id=id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    if request.method == "GET":
        return JsonResponse(post.serialize())
    elif (request.method == "PUT" and request.user.is_authenticated):
        text = json.loads(request.body)['text']
        post = Post.objects.get(id=id)
        try:
            post.text = text
            post.save()
        except IntegrityError as ex:
            print(ex)
            return HttpResponse(status=400)
        return HttpResponse(status=201)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)


@csrf_exempt
@login_required
def delete_posts_api_id(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    if (request.method == "PUT" and request.user.is_authenticated):
        try:
            post.delete()
        except IntegrityError as ex:
            print(ex)
            return HttpResponse(status=400)
        return HttpResponse(status=201)
    else:
        return JsonResponse({
            "error": "PUT request required."
        }, status=400)


@csrf_exempt
def liked_posts_api_id(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        number_of_likes = post.likes.count()
        print(post.likes.all())
        current_user = request.user
        if current_user in post.likes.all():
            liked = True 
        else:
            liked = False
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    if request.method == "GET":
        response = {
            "post": list(post.serialize()),
            "current_user": current_user.username,
            "liked": liked,
            "number_of_likes": number_of_likes
        }
        return JsonResponse(response, safe=False)
    elif request.method == "PUT" and request.user.is_authenticated:
        current_user = request.user
        if liked:
            try:
                post.likes.remove(current_user)
                post.save()
            except IntegrityError as ex:
                print(ex)
                return HttpResponse(status=400)
            return HttpResponse(status=201)
        else:
            post.likes.add(current_user)
            post.save()
            return HttpResponse(status=201)
    else:
        return JsonResponse({
            "error": "GET or PUT request required."
        }, status=400)

@csrf_exempt
def follow_api_user_id(request, user_followed_id):
    user_to_follow = User.objects.get(pk=user_followed_id)
    followers = Follow.objects.filter(user_followed=user_to_follow).all()
    followers_list = []
    followers_num = 0
    for follower in followers:
        followers_list.append(follower.user_following.username)
        followers_num = len(followers_list)
    
    following = Follow.objects.filter(user_following=user_to_follow).all()
    following_list = []
    following_num = 0
    for user_follow in following:
        following_list.append(user_follow.user_followed.username)
        following_num = len(following_list)
    if request.user.is_authenticated:
        current_user = User.objects.get(username=request.user.username)
        follow = Follow.objects.filter(user_following=current_user, user_followed=user_to_follow)
        followed = follow.exists()
        if request.method == "GET":
            response = {
                "current_user": current_user.username,
                "followed": followed, 
                "followers_list": followers_list,
                "following_list": following_list,
                "followers_num": followers_num,
                "following_num": following_num,
                "is_authenticated": request.user.is_authenticated
            }
            return JsonResponse(response, safe=False)
        if request.method not in ["POST", "PUT"]:
            return JsonResponse({
                "error": "POST or PUT request required."
            }, status=400)
        if request.user.is_authenticated and followed: 
            follow.delete()
        elif request.user.is_authenticated:
            new_follow = Follow.objects.create(user_following=current_user, user_followed=user_to_follow)
            new_follow.save()
        return HttpResponse(status=201)
    else:
            response = {
            "followers_list": followers_list,
            "following_list": following_list,
            "followers_num": followers_num,
            "following_num": following_num,
            "is_authenticated": request.user.is_authenticated
        }
            return JsonResponse(response, safe=False)
 

@csrf_exempt
def user_profile_api(request, author_id):
    if request.method == 'GET':
        posts = Post.objects.filter(author=author_id).order_by("-created_at").all()
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)
        current_user = request.user  
        follow = Follow.objects.filter(user_following=current_user.id, user_followed=author_id)
        followed = follow.exists()
        author_username = User.objects.get(id=author_id)
        response = {
            "posts": list(post.serialize() for post in page_obj.object_list),
            "page": page_number,
            "total": math.ceil(len(posts) / 10),
            "current_user": current_user.username,
            "followed":followed,
            "author_username":author_username.username,
            "is_authenticated": request.user.is_authenticated
        }
        return JsonResponse(response, safe=False)
    if request.method is not ["GET"]:
        return JsonResponse({
            "error": "GET request required."
        }, status=400)
    
