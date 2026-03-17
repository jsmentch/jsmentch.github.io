source "https://rubygems.org"

# Jekyll 3.10 + kramdown 2.3.1+ fix Dependabot alerts (CVE-2020-14001, CVE-2021-28834)
gem "jekyll", "~> 3.10"
gem "kramdown", ">= 2.3.1"
gem "kramdown-parser-gfm", "~> 1.1"
gem "jekyll-swiss"
gem "ffi", "~> 1.14.0"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.0" if Gem.win_platform?

