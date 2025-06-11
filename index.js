// index.js — stand-alone, no build step
const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');
const util = require('util');

const sh = util.promisify(exec);

// Count added + deleted lines in current PR
async function countChangedLines() {
  const base = `origin/${github.context.repo.branch}`;
  const { stdout } = await sh(
    `git diff --shortstat $(git merge-base ${base} HEAD)`
  );
  const added   = Number((stdout.match(/(\d+) insertions?\(\+\)/) || [0, 0])[1]);
  const removed = Number((stdout.match(/(\d+) deletions?\(-\)/) || [0, 0])[1]);
  return added + removed;
}

// Comment helper
async function comment(body) {
  const octo = github.getOctokit(process.env.GITHUB_TOKEN);
  await octo.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request.number,
    body
  });
}

// Fail a check-run
async function failCheck(message) {
  const octo = github.getOctokit(process.env.GITHUB_TOKEN);
  await octo.checks.create({
    ...github.context.repo,
    name: 'You Shall Not Pass!',
    head_sha: github.context.sha,
    status: 'completed',
    conclusion: 'failure',
    output: { title: 'Blocked by Gandalf', summary: message }
  });
}

// (Optional) shame board
async function updateShameLog(user, loc) {
  core.info(`${user} added to shame board (+${loc})`);
  // implement file update & git push if you like
}

async function run() {
  const ctx      = github.context;
  const octo     = github.getOctokit(process.env.GITHUB_TOKEN);
  const maxLoc   = parseInt(core.getInput('max_loc') || '500', 10);
  const shameOn  = core.getInput('enable_shame_log') !== 'false';
  const pr       = ctx.payload.pull_request;

  // ---- Pull-request guards -----------------------------------------------
  if (pr) {
    const skip = pr.labels?.some(l => l.name === 'break-the-spell');
    if (skip) return;

    // Friday-evening chill
    const cutoff = core.getInput('friday_cutoff'); // e.g. "17:00"
    if (cutoff && new Date().getDay() === 5) {
      const [h, m] = cutoff.split(':').map(Number);
      const limit  = new Date(); limit.setHours(h, m, 0, 0);
      if (Date.now() > limit) {
        await octo.issues.addLabels({
          ...ctx.repo,
          issue_number: pr.number,
          labels: ['weekend-merge?']
        });
        await comment('It’s Friday evening – let’s merge on Monday 😇');
      }
    }

    // LOC guard
    if (maxLoc > 0) {
      const loc = await countChangedLines();
      if (loc > maxLoc) {
        await failCheck(`PR exceeds LOC limit (${loc} > ${maxLoc})`);
        await comment(
          '![Gandalf](https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif)\n' +
          `**You shall not pass!** PR has **${loc}** changed lines – please split it.`
        );
        if (shameOn) await updateShameLog(pr.user.login, loc);
        process.exit(1);
      }
    }
    return;
  }

  // ---- Direct push to default branch ------------------------------------
  if (
    ctx.eventName === 'push' &&
    ctx.ref === `refs/heads/${ctx.payload.repository.default_branch}`
  ) {
    const pusher    = ctx.actor;
    const allowlist = (core.getInput('allowlist') || '')
                        .split(/[, ]+/).filter(Boolean);
    if (!allowlist.includes(pusher)) {
      core.setFailed(`Direct pushes to main are forbidden, ${pusher}!`);
      // optional: auto-revert here
    }
  }
}

run().catch(err => core.setFailed(err.message));
