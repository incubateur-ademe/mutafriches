#!/bin/bash
FILE=$(node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).tool_input.file_path))")
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.md|*.json) ;;
  *) exit 0 ;;
esac
pnpm exec prettier --write "$FILE" > /dev/null 2>&1
exit 0
