# Big Pull Request Check

A playful gatekeeper that blocks monster PRs and late‑Friday merges with a Gandalf GIF and a firm “You shall not pass!”.

Perfect for teams who value small, reviewable changes and a bit of fun in their CI.

| 🔥 | What it does | Default |
|----|--------------|---------|
| 🚧 **LOC Guard** | Fails the PR check when total changed lines > **`max_loc`** (default 500). | ✅ |
| 📛 **Main Branch Bouncer** | Cancels direct pushes to default branch (creates a revert commit) unless committer is in `allowlist`. | ✅ |
| 🍻 **Friday Chill** | PRs opened after **Friday 17:00** local get the `weekend-merge?` label + friendly nudge. | ✅ |
| 🏷️ **Break-the-Spell Label** | Applying label `break-the-spell` skips all guards. | ✅ |
| 🎞️ **Gandalf GIF Comment** | Posts a meme (`https://giphy.com/gifs/xT0xezQGU5xCDJuCPe`) on violation. | ✅ |
| 🏆 **Shame Leaderboard** | Appends violator to `SHAME_LOG.md` (keeps top 10 offenders). | ✅ |
