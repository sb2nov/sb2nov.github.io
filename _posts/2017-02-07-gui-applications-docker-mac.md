---
layout: post
title: Running GUI applications using Docker for Mac
category: Developer Environment
excerpt: Guide on how to run GUI applications from within Docker on Mac using XQuartz.
redirect_from: /2017/02/07/gui-applications-docker-mac/
---

This is a short guide explaining how to run GUI applications from within Docker on Mac. This uses XQuartz to enable to set the `DISPLAY` variable within the container.

### Install XQuartz

You can install XQuartz using homebrew with `brew cask install xquartz` or directly from the website [here](https://www.xquartz.org/). At the time of writing, I had `2.7.11` installed on my machine with OSX El Capitan. After installing XQuartz restart your machine.

### Install Docker for Mac

Install docker using `brew cask install docker` or directly from the website [here](https://docs.docker.com/docker-for-mac/).

### Run XQuartz
Start XQuartz from command line using `open -a XQuartz`. In the XQuartz preferences, go to the “Security” tab and make sure you’ve got “Allow connections from network clients” ticked:

<img src="/images/blog/2017-02/xquartz_preferences.png" alt="XQuartz Preferences" style="width: 50%; margin-left:10%; margin-right:10%; margin-top:10px; margin-bottom:10px;"/>

### Host Machine IP

`IP=$(ifconfig en0 | grep inet | awk '$1=="inet" {print $2}')` should set the `IP` variable as the ip of your local machine. If you're on wifi you may want to use `en1` instead of `en0`, check the value of the variable using `echo $IP`.

Now add the IP using Xhost with `xhost + $IP`. If the xhost command is not found check `/usr/X11/bin/xhost` as that might not be in your path.

### Running a container

You can now try running firefox in your container with:

```
docker run -d --name firefox -e DISPLAY=$IP:0 -v /tmp/.X11-unix:/tmp/.X11-unix jess/firefox
```

or run octave using:

```
docker run -d --name octave -e DISPLAY=$IP:0 -v /tmp/.X11-unix:/tmp/.X11-unix openmicroscopy/octave
```
