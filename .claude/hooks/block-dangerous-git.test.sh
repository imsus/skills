#!/bin/bash
# Pipes each case through block-dangerous-git.sh and checks its exit code:
# 2 means blocked, 0 means allowed. Run: bash .claude/hooks/block-dangerous-git.test.sh

hook="$(dirname "$0")/block-dangerous-git.sh"
cwd=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
failed=0

expect() {
  local want=$1 command=$2 dir=${3:-$cwd}
  jq -nc --arg c "$command" --arg d "$dir" '{tool_input:{command:$c},cwd:$d}' | "$hook" 2>/dev/null
  local got=$?
  if [ "$got" != "$want" ]; then
    echo "FAIL: want $want, got $got: $command" >&2
    failed=1
  fi
}

# Blocked
expect 2 "git push origin main"
expect 2 "git push origin HEAD:main"
expect 2 "git push --force origin feat/x"
expect 2 "git push -f origin feat/x"
expect 2 "git push origin +feat/x"
expect 2 'git push "--force" origin feat/x'
expect 2 'git push origin "main"'
expect 2 "git reset --hard main"
expect 2 'git reset "--hard" main'
expect 2 "git clean -fd"
expect 2 'git "clean" -fd'
expect 2 "git -C /tmp/x clean -fd"
expect 2 "git branch -D old"
expect 2 "git checkout ."
expect 2 "git restore ."
expect 2 'bash -c "git clean -fd"'
expect 2 "sh -c 'git push --force origin x'"
expect 2 "git commit -m \"it's done\" && git clean -fd && echo \"Bob's\""
expect 2 $'bash <<\'EOF\'\nfor d in a b; do\n  git clean -fd\ndone\nEOF'

# Allowed
expect 0 "git push -u origin feat/x"
expect 0 "git status"
expect 0 "git branch -d old"
expect 0 "git reset --hard main" "$cwd/.claude/worktrees/agent-1"
expect 0 'for c in "git push origin main" "git clean -fd"; do echo "$c"; done'
expect 0 $'git commit -F - -- a.md <<\'EOF\'\nExplain why git push --force origin main and git clean -fd are blocked\nEOF'

[ "$failed" = 0 ] && echo "block-dangerous-git: all cases pass"
exit $failed
