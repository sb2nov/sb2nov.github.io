---
title: Blog
section: blog
layout: blog
---

<div class="hfeed">
  {% for post in site.posts %}
    <div class="hentry post">
      <div class="sticky-header">
        <h2 class="entry-title"><a class="spec" href="{{ post.url }}" title="{{ post.title }}" rel="bookmark">{{ post.title }}</a></h2>
        <div class="byline">{{ post.date | date: "%B %d, %Y" }}{% if post.author %} · by {{ post.author}}{% endif %} . {% for category in post.categories %}{% if forloop.index0 != 0 %}, {% endif %}<a href="/blog/categories.html#{{category}}" class="category">{{ category }}</a>{% endfor %}</div>
      </div><!-- .sticky-header -->


  </div>
  {% endfor %}
</div><!-- .hfeed -->
