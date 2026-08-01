source "https://rubygems.org"

# 有意锁定 ~> 232（当前 rubygems 最新即为 232）：github-pages 单号版本会整体升级 Jekyll/插件集，
# 放开上限可能在 bundle update 时引入破坏性变更；升级时手工评估新版后修改
gem "github-pages", "~> 232", group: :jekyll_plugins

group :development do
  # 仅本地 jekyll serve 需要显式声明（github-pages 232 本身也传递依赖 webrick）
  gem "webrick", "~> 1.8"
end

group :test do
  # 收紧到已验证版本 5.2.2：5.x 内部 minor 也可能改变行为/参数（如 5.x 曾移除
  # --assume-extension），常规 bundle update 不应静默升级；升级前需重新验证
  gem "html-proofer", "~> 5.2.2"
end
