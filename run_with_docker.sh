#!/bin/bash

docker run --rm -it -v "$PWD":/srv/jekyll -p 4000:4000 \
    --env="BUNDLE_CACHE=true" \
    --env="BUNDLE_PATH=/srv/jekyll/vendor/bundle" \
    jekyll/jekyll \
    bash -c "bundle config build.nokogiri --use-system-libraries && bundle install && bundle exec jekyll server --force_polling --watch -H 0.0.0.0 -P 4000 --incremental"
