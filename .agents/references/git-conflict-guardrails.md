# Git Conflict Guardrails

## Absolute Rule

Codex must never resolve Git conflicts for the user.

The only allowed scripted exception is the `$bitbucket-pull-request` governed
`git merge --squash` continuation on the expected `pr/*` branch, when the user
explicitly asks for `ours` or `theirs`, chooses exactly one side, and approves
the exact confirmation phrase required by that skill. Do not offer this option
proactively.

This prohibition applies to conflicts produced by merges, rebases,
cherry-picks, reverts, stashes, pulls, patch application, `git am`, or any
other Git operation that leaves conflicting files or unmerged paths.

Conflict resolution is a user-authorship decision. Do not treat it as a normal
recoverable repository edit.

## Stop Conditions

Stop write work and enter read-only diagnosis when any of these signals are
present:

- conflict markers in a file, such as `<<<<<<<`, `=======`, or `>>>>>>>`
- unmerged paths in Git status
- an in-progress merge, rebase, cherry-pick, revert, or patch application
- Git metadata such as `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`,
  `.git/rebase-merge/`, `.git/rebase-apply/`, or `.git/MERGE_MSG`
- a command output stating that conflicts must be resolved before continuing

## Prohibited Actions

Except for the narrow `$bitbucket-pull-request` scripted exception above, while
conflicts are unresolved, Codex must not:

- edit conflicted files to resolve the conflict
- remove conflict markers
- choose one side of a conflict, including `ours`, `theirs`, current,
  incoming, local, or remote
- run `git checkout --ours`, `git checkout --theirs`,
  `git restore --ours`, or `git restore --theirs`
- run a merge tool or any command that applies a conflict choice
- run `git add` to mark conflicted files as resolved
- run `git commit` to conclude a conflict resolution
- run `git merge --continue`, `git rebase --continue`,
  `git cherry-pick --continue`, `git revert --continue`, `git am --continue`,
  or equivalent continuation commands
- delegate conflict resolution to a subagent

If the user asks Codex to resolve conflicts, refuse briefly and explain that
the user must resolve the conflict manually unless the request exactly matches
the `$bitbucket-pull-request` exception above.

## Narrow Scripted Exception

Codex may run the `$bitbucket-pull-request` conflict continuation only when all
conditions below are true:

- the conflict was produced by that skill's governed `git merge --squash
  <source>` flow
- the current branch is the expected `pr/*` branch
- the user explicitly asks for `ours` or `theirs` in the current session
- the user chooses exactly one side and approves the exact confirmation phrase
  required by the script
- the script validates the pending squash state before applying the choice
- the script stops if any unmerged path remains afterward

In this exception, `ours` means the current `pr/*` branch based on the
destination, and `theirs` means the source branch being squashed. This exception
must not be generalized to merge, rebase, cherry-pick, revert, stash, pull,
patch, `git am`, UI merge tools, arbitrary scripts, or hand-edited conflict
markers.

## Allowed Read-Only Diagnosis

Codex may:

- report that the repository is in a conflicted state
- list conflicted files and unmerged paths
- identify the Git operation currently in progress when detectable
- show relevant status output
- explain the competing sides at a high level without choosing for the user
- suggest that the user resolve the conflicts manually and then report back

Do not produce a patch that resolves the conflicted content.

## After User Resolution

Commit creation or Git operation continuation is allowed if and only if the
user has resolved the conflicts manually, except for the narrow
`$bitbucket-pull-request` scripted exception above.

After the user explicitly states in the current session that conflicts were
resolved, Codex may:

1. inspect status and conflict markers read-only
2. confirm there are no unmerged paths or remaining conflict markers
3. stage files the user already resolved, when staging is necessary
4. run the relevant continuation command, such as `git merge --continue`,
   `git rebase --continue`, `git cherry-pick --continue`,
   `git revert --continue`, or `git am --continue`
5. create the commit that concludes the operation, when that is the appropriate
   Git flow and the user has requested or authorized continuation

If inspection still shows unmerged paths or conflict markers, stop and ask the
user to finish resolving them manually.

## Subagents

Git conflict resolution is never delegable.

In team mode, the parent agent may ask subagents for read-only diagnosis only.
No subagent may edit conflicted files, choose conflict sides, stage resolved
files, continue a Git operation, or create the conflict-resolution commit.
