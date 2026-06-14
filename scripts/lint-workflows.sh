#!/usr/bin/env bash
set -euo pipefail

if command -v actionlint >/dev/null 2>&1; then
  actionlint "$@"
  exit 0
fi

ruby - "$@" <<'RUBY'
require "yaml"

files = ARGV
if files.empty?
  files = Dir.glob([".github/workflows/*.yml", ".github/workflows/*.yaml"]).sort
end

if files.empty?
  warn "No workflow files found under .github/workflows"
  exit 1
end

files.each do |file|
  YAML.load_file(file)
  puts "parsed #{file}"
end
RUBY
