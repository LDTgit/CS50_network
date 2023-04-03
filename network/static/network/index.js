document.addEventListener('DOMContentLoaded', function() {
  // Load all posts 
  loadAllPosts()

  // Create a New Post box at the top of the All Posts page
  let newPostButton = document.querySelector("#new_post_button")
  if (newPostButton){
    newPostButton.onclick = event => createNewPost(event)
  }

  // Clicking on the username in the top menu will load that user’s profile page.
  
  if (document.getElementById("current-username") != null){
    let myPage = document.getElementById("current-username")
    let currentUserId = document.getElementById("current-username-id").value
    myPage.onclick = event => {
      loadProfile(currentUserId)
      .then(() => getUsername(currentUserId))
      .then(() => clearAll())
      .then(() => showFollowingInfo(currentUserId))
      .then(()=> document.querySelector('h1').scrollIntoView())
      .then(()=> {
        if (document.querySelector("#new-post") != null){
          document.querySelector("#new-post").remove()
        }
      })
    }
  }


// Clicking on the Following page in the top menu will load a page with all the posts by followed users
if (document.getElementById("following-page") != null){
  let followingPage = document.getElementById("following-page")
  followingPage.onclick = event => {
    loadFollowingPage(1)
  }
}
});


async function loadFollowingPage(page){
  if (!page){
    page=1
  }
  return fetch("/api/following_page?page=" + page)
  .then(response => response.json())
  .then(e => {
    if (document.querySelector("#new-post") != null){
      document.querySelector("#new-post").remove()
    }
    document.querySelector("h1").innerHTML = "Following posts"
    clearAll()
    getTweets(e)
  })
}


async function loadAllPosts(page){
  if (!page){
    page=1
  }
  return fetch("/api/posts?page=" + page)
  .then(response => response.json())
  .then(e => {
    if (document.querySelector("h1")!=null){document.querySelector("h1").innerHTML = "All Posts"}
    getTweets(e)
  })
}

async function getUsername(user_id){
  document.querySelector("h1").innerHTML = document.getElementById("current-username").innerHTML
}

function clearAll() {
  let title_info = document.getElementById('title');
  while (title_info.children.length > 1) {
    title_info.removeChild(title_info.lastChild);
  }
}

async function showFollowingInfo(user_id){
  document.querySelector("#title").appendChild(createFollowInfo('Following', await following(user_id)));
  document.querySelector("#title").appendChild(createFollowInfo('Followers', await followers(user_id)));
  if (document.getElementById("current-username-id") !=null){
    if (user_id != document.getElementById("current-username-id").value){
      await getFollowButton(user_id);
    }
  }
  

}

function createFollowInfo(name, number) {
  let mySpan = document.createElement('span');
  console.log(name);
  console.log(number);
  mySpan.textContent = number + " " + name;
  mySpan.className = "following-info"
  return mySpan;
}

async function following(user_id){
  const response = await fetch(`/api/follow/` + user_id);
  const e = await response.json();
 return e.following_num;
}

async function followers(user_id){
  const response = await fetch(`/api/follow/` + user_id);
  const e = await response.json();
 return e.followers_num;
}

async function getFollowButton(user_id){
  const response = await fetch(`/api/follow/` + user_id);
  const e = await response.json();
  const followBtn = document.createElement("button");
  followBtn.className = `post-button`;
  followBtn.id = 'follow-btn' + user_id;
  if (e.followed === true) {
    followBtn.innerHTML = "Unfollow";
  } else {
    followBtn.innerHTML = "Follow";
  }
  followBtn.onclick = event => {
    followAuthor(user_id)
    .then(()=>loadProfile(user_id, 1))
    .then(() => clearAll())
    .then(() => showFollowingInfo(user_id))
  }
  
  document.querySelector("#title").appendChild(followBtn);
  
}

async function updateFollowButton(user_id){
  const response = await fetch(`/api/follow/` + user_id);
  const e = await response.json();
  if (e.followed === true) {
    Array.prototype.forEach.call(
      document.getElementsByClassName(`follow` + user_id),
      element => element.innerHTML = "Unfollow",
    );
    if (document.querySelector(`#follow-btn` + user_id) != null){
      document.querySelector(`#follow-btn` + user_id).innerHTML = "Unfollow"
    }
  } else {
    Array.prototype.forEach.call(
      document.getElementsByClassName(`follow` + user_id),
      element => element.innerHTML = "Follow",
    );
    if (document.querySelector(`#follow-btn` + user_id) != null){
      document.querySelector(`#follow-btn` + user_id).innerHTML = "Follow"
    }
  }
}

function followAuthor(user_id){
  return fetch(`/api/follow/`+ user_id, {
    method: 'PUT',
    body: JSON.stringify(), credentials: 'same-origin'
  })
}

async function loadProfile(author_id, page){
  if (!page){
    page=1
  }
  const response = await fetch("/api/profile/" + author_id + "?page=" + page);
  const e = await response.json();
  if (document.querySelector("#new-post") != null){
    document.querySelector("#new-post").remove()
  }
  getTweets(e)
}

function getTweets(response){
  let tweetListElement = document.querySelector("#tweet_list")
  if (tweetListElement !=null){
    tweetListElement.replaceChildren()
  }
  response.posts.forEach( tweet => {
    const postContent = document.createElement("div");
    postContent.className="post-container";
    postContent.id = `post-container${tweet.id}`
    
    const postDetails = document.createElement("div");
    postDetails.id = `post-info${tweet.id}`;

    const postAuthor = document.createElement("div");
    postAuthor.className = "info-container"
    

    const authorContainer = document.createElement("div");
    authorContainer.className = "author-container"

    const postAuthorId = document.createElement("input");
    postAuthorId.id = `author-id`
    postAuthorId.type = "hidden"
    postAuthorId.value = `${tweet.author_id}`

    const managePost = document.createElement("div");
    managePost.className = "manage-post";

    if (response.is_authenticated && response.current_user == tweet.author){
      postAuthor.innerHTML = `Your post`
      postAuthor.style.color = "#55ACEE"
      const postEdit = document.createElement("button");
      postEdit.className = "post-button"
      postEdit.id = `edit-button${tweet.id}`
      postEdit.innerHTML = `Edit`
      managePost.appendChild(postEdit)
      postEdit.onclick = event => {
        editPost(tweet.id)
      };
      const postDelete = document.createElement("button");
      postDelete.className = "post-button"
      postDelete.id = `delete-button${tweet.id}`
      postDelete.innerHTML = `Delete`
      managePost.appendChild(postDelete)
      postDelete.onclick = event => {
        deletePost(tweet.id)
      };
    } else {
      postAuthor.innerHTML = `${tweet.author}`
      postAuthor.id = "author-button"
      postAuthor.onclick = event => {
        document.querySelector("h1").innerHTML = `${tweet.author}`
        loadProfile(tweet.author_id)
        .then(() => clearAll())
        .then(() => showFollowingInfo(tweet.author_id))
        .then(()=> document.querySelector('h1').scrollIntoView())
        .then(()=> {
          let new_post = document.querySelector("#new-post")
          if (new_post != null){
            document.querySelector("#new-post").remove()
          }
        })
      }
    }
    
    const postCreateDate = document.createElement("div");
    postCreateDate.className = "info-container";
    postCreateDate.id = "date_created";
    postCreateDate.innerHTML = `${tweet.created_at}`

    const followButton = document.createElement("button");
    followButton.className = `post-button follow${tweet.author_id}`;

    if (response.is_authenticated && response.current_user != tweet.author){
      updateFollowButton(tweet.author_id);
      followButton.onclick = event => {
        followAuthor(tweet.author_id)
        .then(()=> updateFollowButton(tweet.author_id))
      }
    }

    const postText = document.createElement("div");
    postText.className = "info-container"
    postText.id = `text${tweet.id}`
    postText.innerHTML = `${tweet.text}`

    const numLikes = document.createElement("span");
    numLikes.className = "num_likes";
    numLikes.id = `num_likes${tweet.id}`
    numLikes.innerHTML = `${tweet.likes.length}`

    const likeContainer = document.createElement("div");
    likeContainer.className = "like-container"

    const likeButton = document.createElement("button");
    likeButton.className = "fa fa-heart like";
    likeButton.id = `like_button${tweet.id}`
    if (response.is_authenticated && tweet.likes.includes(response.current_user)){
      likeButton.style = "color:red";
    }
    if (tweetListElement !=null){
      tweetListElement.appendChild(postContent);
      likeContainer.append(numLikes, likeButton);
      authorContainer.append(postAuthor, postAuthorId);
      postContent.append(authorContainer, postText, postDetails, likeContainer);
      postDetails.append(postCreateDate, managePost);
      if (response.is_authenticated && response.current_user != tweet.author){
        authorContainer.append(followButton);
      }

      if (response.is_authenticated){
        likeButton.onclick = event => {
          likePost(tweet.id).then(()=> getLikes(tweet.id))
        }
      }
    }
  })

  let currentPage = parseInt(response.page)
  let hasPrevious = (currentPage > 1)
  let totalPages = response.total
  let nextPage = currentPage + 1

  paginationProcess(hasPrevious, currentPage, nextPage, totalPages)
}

function createNewPost(event){
  event.target.disabled = true
  let text = document.querySelector("#new_post_text").value
  fetch("api/posts", {
    method: 'POST',
    body: JSON.stringify({
        text: text
    }), credentials: 'same-origin'
  }).then(response => loadAllPosts())
  .then(response => cleanUpNewPost())

}

function cleanUpNewPost(){
  let newPostButton = document.querySelector("#new_post_button")
  newPostButton.disabled=false
  let text = document.querySelector("#new_post_text")
  text.value = ""
}

function editPost(id){
  fetch(`/api/posts/`+ id)
  .then(response => response.json())
  .then(e => {
    document.querySelector(`#text${id}`).innerHTML =""
    document.querySelector(`#post-info${id}`).innerHTML = `
      <div id="post-container">
        <textarea class="my-post-input" cols="50" id="updated_text" rows="5">${e.text}</textarea>
        <br>
        <span>
        <button class="post-button" id="update_post" role="button">Post</button>
        </span>
        <span>
        <button class="post-button" id="cancel_update_post" role="button">Cancel</button>
        </span>
      </div>
    `
    //Autofocus on updated_text textarea
    let body_text = document.querySelector('#updated_text');
    body_text.focus();
    document.querySelector('#update_post').onclick = event => {
      const text = document.querySelector('#updated_text').value 
      fetch(`/api/posts/`+ id, {
        method: 'PUT',
        body: JSON.stringify({
            text: text
        }), credentials: 'same-origin'
      }).then(response => loadAllPosts())
      .then(response => cleanUpNewPost())
    }
    cancelPost(id)
  });
}


function cancelPost(id){
  document.querySelector('#cancel_update_post').onclick = event => {
    fetch(`/api/posts/`+ id)
    .then(response => response.json())
    .then(e => {
      const myTweet = document.querySelector(`#post-container${id}`)
      myTweet.replaceChildren()
      const myPostDetails = document.createElement("div");
      myPostDetails.id = `post-info${id}`;
      const myAuthorContainer = document.createElement("div");
      myAuthorContainer.className = "author-container";
      const myPostAuthor = document.createElement("div");
      myPostAuthor.className = "info-container"
      const myPostAuthorId = document.createElement("input");
      myPostAuthorId.id = `author-id`
      myPostAuthorId.type = "hidden"
      myPostAuthorId.value = `${e.author_id}`
      myPostAuthor.innerHTML = `Your post`
      myPostAuthor.style.color = "#55ACEE"
      const myManagePost = document.createElement("div");
      myManagePost.className = "manage-post";
      const myPostEdit = document.createElement("button");
      myPostEdit.className = "post-button"
      myPostEdit.id = `edit-button${id}`
      myPostEdit.innerHTML = `Edit`
      myManagePost.appendChild(myPostEdit)
      myPostEdit.onclick = event => {
          editPost(id)
        };
      const myPostDelete = document.createElement("button");
      myPostDelete.className = "post-button"
      myPostDelete.id = `delete-button${id}`
      myPostDelete.innerHTML = `Delete`
      myManagePost.appendChild(myPostDelete)
      myPostDelete.onclick = event => {
        deletePost(id)
      };
      const myPostCreateDate = document.createElement("div");
      myPostCreateDate.className = "info-container";
      myPostCreateDate.id = "date_created";
      myPostCreateDate.innerHTML = `${e.created_at}`
      const myPostText = document.createElement("div");
      myPostText.className = "info-container"
      myPostText.id = `text${id}`
      myPostText.innerHTML = `${e.text}`
      const myLikeContainer = document.createElement("div");
      myLikeContainer.className = "like-container"
      const myNumLikes = document.createElement("span");
      myNumLikes.className = "num_likes";
      myNumLikes.id = `num_likes${id}`
      myNumLikes.innerHTML = `${e.likes.length}`
      const myLikeButton = document.createElement("button");
      myLikeButton.className = "fa fa-heart like";
      myLikeButton.id = `like_button${id}`
      let myPostContent = document.querySelector(`#post-container${id}`)
      myLikeContainer.append(myNumLikes, myLikeButton);
      myAuthorContainer.append(myPostAuthor, myPostAuthorId);
      myPostContent.append(myAuthorContainer, myPostText, myPostDetails, myLikeContainer);
      myPostDetails.append(myPostCreateDate, myManagePost);
    })
    .then(()=> {
    document.querySelector(`#edit-button${id}`).onclick = event => {
      editPost(id)
    };})
    .then(()=> {
    document.querySelector(`#delete-button${id}`).onclick = event => {
      deletePost(id)
    }})
  }
}

function deletePost(id){
  fetch(`/api/posts/delete/`+ id, {
    method: 'PUT',
    credentials: 'same-origin'
  }).then(response => loadAllPosts())
  .then(response => cleanUpNewPost())
}

function likePost(id){
  return fetch(`/api/posts/liked/`+ id, {
    method: 'PUT',
    body: JSON.stringify(), credentials: 'same-origin'
  })
}

async function getLikes(id){
  const response = await fetch(`/api/posts/liked/` + id);
  const e = await response.json();
  console.log(e.liked);
  console.log(e.number_of_likes);
  if (e.liked === true) {
    document.getElementById(`like_button` + id).style.color = "red";
  } else {
    document.getElementById(`like_button` + id).style.color = "black";
  }
  document.getElementById(`num_likes` + id).innerHTML = `${e.number_of_likes}`;
}

function paginationProcess(hasPrevious, currentPage, nextPage, totalPages){
  let pagination = document.querySelector(".pagination")
  if (pagination !=null){
    pagination.replaceChildren()
  }
  const step = document.createElement("span");
  step.className = "step-links"
  if (pagination !=null){
    pagination.appendChild(step)

    let pageName = document.querySelector("h1").innerHTML

    if(hasPrevious) {
      const linkPrevious = document.createElement("button")
      linkPrevious.id='previous'
      linkPrevious.innerHTML = `previous`
      step.appendChild(linkPrevious)
      if (pageName === "All Posts"){
        linkPrevious.onclick = event => {
          loadAllPosts(currentPage-1)
          .then(()=> 
          setTimeout(() => {
            document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
          })
          )
        }
      } else {
        if ( pageName === "Following posts"){
          linkPrevious.onclick = event => {
            loadFollowingPage(currentPage-1)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        }
        else if (document.getElementById("current-username")!=null && pageName === document.getElementById("current-username").innerHTML){
          let pageID = document.getElementById("current-username-id").value
          linkPrevious.onclick = event => {
            loadProfile(pageID, currentPage-1)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        } 
        else {
          let pageID = document.getElementById("author-id").value
          linkPrevious.onclick = event => {
            loadProfile(pageID, currentPage-1)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        }
      };
    }
  
    const current = document.createElement("span")
    current.className="current"
    current.innerHTML = `Page ${currentPage} of ${totalPages}`
    step.appendChild(current)
    
    if (nextPage <= totalPages){
      const linkNext = document.createElement("button")
      linkNext.innerHTML = `next`
      linkNext.id = 'next'
      step.appendChild(linkNext)
      if (pageName === "All Posts"){
        linkNext.onclick = event => {
          loadAllPosts(nextPage)
          .then(()=> 
          setTimeout(() => {
            document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
          })
          )
        }
      } else {
        if ( pageName === "Following posts"){
          linkNext.onclick = event => {
            loadFollowingPage(nextPage)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        }
        else if (document.getElementById("current-username") !=null && pageName === document.getElementById("current-username").innerHTML){
          let pageID = document.querySelector("current-username-id").value
          linkNext.onclick = event => {
            loadProfile(pageID, nextPage)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        } else{
          let pageID = document.getElementById("author-id").value
          linkNext.onclick = event => {
            loadProfile(pageID, nextPage)
            .then(()=> 
            setTimeout(() => {
              document.querySelector('.navbar').scrollIntoView({block:"center", behavior:"smooth"})
            })
            )
          }
        }
      };
    } 

  }
  

}
