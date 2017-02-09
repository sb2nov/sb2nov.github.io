require 'fileutils'
require 'html-proofer'

task :test do
  FileUtils.rm_rf('./_site')
  sh "bundle exec jekyll build --config _config.yml"
  HTMLProofer.check_directory("./_site", {
    :allow_hash_href => true,
    :check_html => true,
    :file_ignore => [],
    :url_ignore => [
      "/mac-setup",
      "http://www.linkedin.com/in/sbajaj9/"]
    }).run
end
