#!/usr/bin/env bash
set -euo pipefail

ruby <<'RUBY'
require "yaml"

workflow_paths = Dir.glob(".github/workflows/*.{yml,yaml}").sort
if workflow_paths.empty?
  warn "No GitHub Actions workflow files found."
  exit 1
end

allowed_write_scopes = {
  "security-events" => "code scanning result upload"
}

errors = []

def location_label(path, location)
  location == "workflow" ? path : "#{path} #{location}"
end

def check_permissions(path, location, permissions, allowed_write_scopes, errors)
  label = location_label(path, location)

  if permissions.nil?
    errors << "#{label}: missing explicit permissions"
    return
  end

  unless permissions.is_a?(Hash)
    errors << "#{label}: permissions must be a least-privilege map, not #{permissions.inspect}"
    return
  end

  permissions.each do |raw_scope, raw_level|
    scope = raw_scope.to_s
    level = raw_level.to_s

    unless %w[read write none].include?(level)
      errors << "#{label}: permissions.#{scope} must be read, write, or none"
      next
    end

    next unless level == "write"

    unless allowed_write_scopes.key?(scope)
      errors << "#{label}: permissions.#{scope}: write is not allowlisted; add the narrow reason to scripts/verify-workflow-permissions.sh"
    end
  end
end

workflow_paths.each do |path|
  document = YAML.safe_load(File.read(path), aliases: true) || {}
  unless document.is_a?(Hash)
    errors << "#{path}: workflow YAML must parse to a mapping"
    next
  end

  check_permissions(path, "workflow", document["permissions"], allowed_write_scopes, errors)

  jobs = document["jobs"]
  next unless jobs.is_a?(Hash)

  jobs.each do |job_id, job|
    next unless job.is_a?(Hash) && job.key?("permissions")

    check_permissions(path, "jobs.#{job_id}", job["permissions"], allowed_write_scopes, errors)
  end
end

if errors.any?
  warn "Workflow permission gate failed:"
  errors.each { |error| warn "  - #{error}" }
  exit 1
end

puts "Workflow permission gate passed for #{workflow_paths.length} workflow file(s)."
RUBY
