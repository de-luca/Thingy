Thingy
=====
Thingy is a "Node.js-based-single-file-live-blogging-platform-thing".  

What is it ?
-----
Thingy is a small (future less?) project mostly made in planes, trains, international areas and coffee shops.  
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

Because there's no web interface, Thingy comes with a script allowing to do the posting tasks.

The transactions are "secured" with a key. I personally recommend a 50 to 100 random alphanumeric character long one, but hey, use your dog's name if you want to.  
*There's a loooooooot of `console.log` so you have something to read during your long winter nights.*

Features
-----
- Live feed for readers (new posts are pushed to users currently reading)
- Markdown supported (and everything the markdown parser can handle)
- Trigger easy IP banning (any request not perfectly sent has it's IP banned. IP banned should not read what you have to say.)
- Redis based (easy to use, extend or play with)
- Exists (yep that's a feature!)

Configuration
-----
The project is intended to be used with Heroku, so it uses the `process.env` array to store it's configuration (check [this article](https://devcenter.heroku.com/articles/config-vars) to know more).  

- **THINGY_TITLE**: This is the title of your Thing.
- **THINGY_SUBTITLE**: This is a string representing an array of strings (parsed on startup) containing your subtitles.
- **THINGY_KEY**: This is the key you use to protect your Thing.
- **THINGY_POST_MAN_USER_AGENT**: This is the user agent regex you want to use when posting/deleting.
- **REDIS_URL**: (Auto generated) This is the redis connection string.

*For local dev, Heroku tool belt is used so it can "inject" .env value for you.*

The PostMan
-----
He's the one who's gonna interface between your fingers and Thingy.  
He mostly spends his time in the `post_man.sh` script.  
In order to use him you'll need to setup some stuff:
- **The host**: the Internet is BIG, he needs to know where to send your masterpieces.
- **The key**: your Thingy should not have any intruder so give him the key so he don't get shot down by that easy picking turret.
- **The editor**: He's also gonna hands you down the paper to write. Better be the one you like. (I'm not a VIM kind of person so it use nano by default).

Showcase
-----
You can see what it looks like [here](https://guarded-hollows-7165.herokuapp.com) (deployed on Heroku).
