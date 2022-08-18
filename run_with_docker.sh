#!/bin/bash

docker run --rm -it -v "$PWD":/site -p 4000:4000 \
    --env="BUNDLE_CACHE=true" \
    --env="BUNDLE_PATH=/site/vendor/bundle" \
    bretfisher/jekyll-serve
