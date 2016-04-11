# Thingy

> "Node.js-based-single-file-live-blogging-platform-thing"

## What is it ?

Thingy is a small (future less?) project mostly made in planes, trains, international areas and coffee shops.  
I always wanted to make a blog but I'm lazy and wouldn't have the courage to make big posts or even setup the big thing.  
So I made a thing that is fast and very simple.  
The whole blog is one page... That's it...  
No pagination, no admin panel, no connection, nothing! Only posts! And they should be pretty small...

## How does that work?

The whole thing is based on 3 requests:
- **GET**: display all the posts
- **POST**: send a new post for people to enjoy
- **DELETE**: delete a post for people not to enjoy anymore

Because there's no web interface, Thingy comes with 3 endpoints you can send request to.  
*The transactions are secured by a `user:password` system.*

## Features

- Live feed for readers (new posts are pushed to users currently reading)
- Markdown supported (and everything the markdown parser can handle)
- Supports multiple writers
- Trigger easy IP banning (any request not perfectly sent has it's IP banned. IP banned should not read what you have to say.)
- Exists (yep that's a feature!)

## Configuration

The project is intended to be used with Heroku, so it uses the `process.env` array to store it's configuration (check [this article](https://devcenter.heroku.com/articles/config-vars) to know more).  

- **THINGY_TITLE**: This is the title of your Thing.
- **THINGY_SUBTITLE**: This is a string representing an array of strings (parsed on startup) containing your subtitles.

## Add users

You'll need to manually add your users in the table `user` (check [this article](https://devcenter.heroku.com/articles/heroku-postgresql) for informations using Heroku).

Here is the node script used to generate the hashed password:
```js
pass = "YourPassWord"
salt = crypto.randomBytes(128).toString('base64')
salt+':'+crypto.pbkdf2Sync(pass, salt, 10000, 512, 'sha512').toString('hex')
```
Edit and save it in a file then run `cat thefilejustcreated | node -i` then you'll have your hash.  
*Don't forget to remove the file.*

## The PostMan

He's the one who's gonna interface between your fingers and Thingy.  
He mostly spends his time in the `post_man.sh` script.  
In order to use him you'll need to setup some stuff:
- **The host**: the Internet is BIG, he needs to know where to send your masterpieces.
- **The editor**: He's also gonna hands you down the paper to write. Better be the one you like. (I'm not a VIM kind of person so it use nano by default).

#### `post_man.sh status`
Display current configuration of the PostMan
#### `post_man.sh post`
Start the post service, will open the editor then ask for username and password.
#### `post_man.sh delete <id>`
Delete the post with the specified id. Asks username and password before removing.
#### `post_man.sh set-host <host>`
Set the specified host to send request to.
#### `post_man.sh set-editor <editor>`
Set the specified editor to be used when using the post service.



Showcase
-----
You can see what it looks like [here](https://guarded-hollows-7165.herokuapp.com) (deployed on Heroku).
