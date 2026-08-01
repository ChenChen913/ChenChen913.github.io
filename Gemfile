source "https://rubygems.org"

# 有意锁定 ~> 232（当前 rubygems 最新即为 232）：github-pages 单号版本会整体升级 Jekyll/插件集，
# 放开上限可能在 bundle update 时引入破坏性变更；升级时手工评估新版后修改
gem "github-pages", "~> 232", group: :jekyll_plugins

group :development do
  # 仅本地 jekyll serve 需要显式声明（github-pages 232 本身也传递依赖 webrick）
  gem "webrick", "~> 1.8"
end

group :test do
  # 有意锁在 5.x：6.x 有 API 变化，升级前需重新验证 htmlproofer 命令兼容性；后续定期重估
  gem "html-proofer", "~> 5.2"
end
