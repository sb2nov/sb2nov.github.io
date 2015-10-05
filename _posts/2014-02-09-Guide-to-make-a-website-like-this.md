---
layout: post
title: Guide to make a website like this
date: 2014-02-09 15:27:31
---

This is my first blog post since I redesigned my website to be hosted using [Jekyll](http://jekyllrb.com/). I have been using [Github pages](http://pages.github.com/) for quite sometime now to host my portfolio but today I decide to revamp the whole thing and create a blog as well.

So now that I just created this website and don't know what to write about. I might just as well document how I created this thing. You can get the source code for the website at [https://github.com/sb2nov/sb2nov.github.io](https://github.com/sb2nov/sb2nov.github.io).

**Step 1** : Create a new github repository `username.github.io` in your account.

**Step 2** : Install Jekyll using the command `gem install jekyll`.

**Step 3** : Create the clone of Jekyll bootstrap and set the remote to track the repository you just created.

        git clone https://github.com/plusjade/jekyll-bootstrap.git portfolio
        cd portfolio
        git remote set-url origin git@github.com:USERNAME/USERNAME.github.io.git
        git push origin master

**Step 4** : Change and modify your theme using [Twitter Bootstrap](http://getbootstrap.com/).

**Step 5** : Create the pages you want using `rake page name="pages/about.html"`, similarly create the other pages as well.

**Step 6** : Create your first post using `rake post title="Hello World"`.

**Step 7** : Remove the default example posts `rm -rf _posts/core-examples`

**Step 8** : Edit the `index.md` as per requirements.

**Step 9** : Change the default template as need be, it is located in `_include/themes/bootstrap/defaults.html`. I made some style change and removed the buttons and navbar at the side to set my current layout. And I added the links to the pages I had created in the `step 5`.

**Step 10** : Just push the source code to the github repository and Github will automatically render it, `git push`.

**Step 11** : It you find anything wrong in this guide. Please let me know about it.
