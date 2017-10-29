---
layout: post
title: Social media Share icons for Jekyll
category: Developer Environment
excerpt: Guide on how to add social media share buttons on your Jekyll blog.
---
I recently added share icons on each blogpost to make it easier for readers to share the posts on social media. I did it with just HTML and CSS. Here is what the final output looked like:

<img src="/images/blog/2017-10/share_demo.png" align="center" alt="Innovation" style="margin:auto; display:block;"/>

This is a short guide on how to add this to your own blog.

### Download Images
First we need to download svg images for the social media buttons we're going to create. You can use [SimpleIcons](https://simpleicons.org/). In this tutorial we'll use images for Reddit, Hacker News, Twitter and LinkedIn.

Once you've downloaded the images add then to `_includes/social` directory in your Jekyll project.

### HTML block
Let's add the HTML code for the social media icons. You can create a `_includes/share.html` file for this. Don't forget to change `USERNAME` with your account on Twitter.

{% raw %}
```html
<div class="sharebuttons">
  <hr />
  <ul>
    <li>
      <p class="sharetitle"> Share this: </p>
    </li>
    <li class="reddit">
      <a href="http://www.reddit.com/submit?url={{ page.url | replace:'index.html','' | prepend: site.baseurl | prepend: site.url | uri_escape}}&title={{ page.title | default:"" | uri_escape }}" target="_blank">
        {% include social/share-icon-reddit.svg %}
      </a>
    </li>
    <li class="hn">
      <a href="http://news.ycombinator.com/submitlink?u={{ page.url | replace:'index.html','' | prepend: site.baseurl | prepend: site.url | uri_escape}}&t={{ page.title | default:"" | uri_escape}}" target="_blank">
        {% include social/share-icon-hn.svg %}
      </a>
    </li>
    <li class="twitter">
      <a href="https://twitter.com/intent/tweet?via=USERNAME&url={{ page.url | replace:'index.html','' | prepend: site.baseurl | prepend: site.url | uri_escape}}&text={{ page.title | default:"" | uri_escape}}" target="_blank">
        {% include social/share-icon-twitter.svg %}
      </a>
    </li>
    <li class="linkedin">
      <a href="https://www.linkedin.com/shareArticle?mini=true&url={{ page.url | replace:'index.html','' | prepend: site.baseurl | prepend: site.url | uri_escape}}&title={{ page.title | default:"" | uri_escape}}" target="_blank">
        {% include social/share-icon-linkedin.svg %}
      </a>
    </li>
  </ul>
</div>
```
{% endraw %}

### Add layout to the post template
We need to include this block in the layout file which might be `_layouts/post.html`. Add the one line to that file.

{% raw %}
```html
{% include share.html %}
```
{% endraw %}

### Style the buttons
In the CSS file for the site, add the following snippet. We got the colors for the icons from [SimpleIcons](https://simpleicons.org/).

```css
/* Share buttons */
.sharebuttons {
  margin: 0 auto 0 auto;
}

.sharebuttons ul {
  margin: 20px 0 0 0;
  text-align: center;
}

.sharebuttons ul li {
  display: inline;
}

.sharebuttons ul li a {
  text-decoration: none;
}

.sharebuttons ul li svg {
  width: 40px;
  height: 40px;
}

.sharebuttons .reddit svg {
  fill: #FF4500;
}

.sharebuttons .hn svg {
  fill: #F0652F;
}

.sharebuttons .twitter svg {
  fill: #1DA1F2;
}

.sharebuttons .linkedin svg {
  fill: #0077B5;
}
```

### Share this post
Now you can build your site to check the output. Don't forget to share this post :)
