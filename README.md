Thingy
=====
Thingy is a "Node.js-based-single-file-live-blogging-platform-thing".  

What is it ?
-----
Thingy is a small (future less?) project mostly made in planes, international area and coffee shops.  
I always wanted to make a blog but I'm lazy and wouldn't have the courage to make big posts or even setup the big thing.  
So I made a thing that is fast and very simple.  
The whole blog is one page... That's it...  
No pagination, no admin panel, no connection, nothing! Only posts! And they should be pretty small...

How does that work?
-----
The whole thing is based on 3 kind of requests:
- GET: display all the posts
- POST: send a new post for people to enjoy
- DELETE: delete a post for people not to enjoy

Because there's no interface, you should check out CURL (or any other thing like that) to directly send request to the host.  

The transactions are "secured" with a key. I personally recommend a 50 to 100 random alphanumeric character long one, but hey, use your dog's name if you want to.

Features
-----
- Live feed for reader (new posts are pushed to users currently reading)
- Markdown supported (and everything the markdown parser can handle)
- Trigger easy IP banning (any IP attempting to do something "strange" is automatically banned on first attempt)
- Redis based (easy to use, extend, play with)
- Exists (yep that's a feature!)

Showcase
-----
You can see what it looks like [here](https://guarded-hollows-7165.herokuapp.com).
