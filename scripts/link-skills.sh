#!/usr/bin/env bash

set -e

mkdir -p .claude/skills

for dir in .agents/skills/*; do
  name=$(basename "$dir")
  rm -rf ".claude/skills/$name"
  ln -s "$(pwd)/$dir" ".claude/skills/$name"
done
