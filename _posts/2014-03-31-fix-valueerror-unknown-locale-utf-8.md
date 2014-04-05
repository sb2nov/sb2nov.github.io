---
layout: post
title: "Fix Value Error: unknown locale: UTF 8"
description: "Fix for the unknown local problem in Macs"
category: python
tags: [python, locale, install]
---
{% include JB/setup %}

Today I was trying to install AWS cli and got this error when running the help command.

~~~
raise ValueError, 'unknown locale: %s' % localename
ValueError: unknown locale: UTF-8
~~~

The solution was to add some environment variables to my zsh environment. So I added this to my `env-config` files.

~~~
export LANG="en_US.UTF-8"
export LC_COLLATE="en_US.UTF-8"
export LC_CTYPE="en_US.UTF-8"
export LC_MESSAGES="en_US.UTF-8"
export LC_MONETARY="en_US.UTF-8"
export LC_NUMERIC="en_US.UTF-8"
export LC_TIME="en_US.UTF-8"
export LC_ALL=
~~~

To test the code run:

    python -c 'import locale; print(locale.getdefaultlocale());'

And you should see `('en_US', 'UTF-8')` as the output.

References for the post

- [Patrick Armino's Blogpost](http://patrick.arminio.info/blog/2012/02/fix-valueerror-unknown-locale-utf8/)
- [Stackoverflow](http://stackoverflow.com/questions/19961239/pelican-3-3-pelican-quickstart-error-valueerror-unknown-locale-utf-8)
