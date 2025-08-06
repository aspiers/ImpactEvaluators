source "https://rubygems.org"

# Jekyll
gem "jekyll", "~> 4.3"

# AsciiDoc processor
gem "asciidoctor", "~> 2.0"

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

group :jekyll_plugins do
  gem "jekyll-asciidoc"
  gem "jekyll-feed"
  gem "jekyll-sitemap"
  gem "jekyll-remote-theme", "~> 0.4.3"
end
