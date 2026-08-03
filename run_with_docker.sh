#!/bin/bash

set -euo pipefail

# Pin the multi-architecture image to Ruby 3.1. The upstream `latest` tag is
# intentionally unversioned and currently uses Ruby 4, which is incompatible
# with the GitHub Pages dependencies in Gemfile.lock.
JEKYLL_IMAGE="bretfisher/jekyll-serve@sha256:a3a1592c6a97f2d038406b93a09abeb731d95257092a4a1d0994a11bb73de9ca"

docker run --rm -it -v "$PWD":/site -p 4000:4000 \
    --env="BUNDLE_CACHE=true" \
    --env="BUNDLE_PATH=/site/vendor/bundle" \
    "$JEKYLL_IMAGE"
