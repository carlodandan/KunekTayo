/**
 * notify-discord-commits.mjs
 * Sends a summary of commits pushed or merged to prod branch to Discord.
 */

import fs from "node:fs";

async function main() {
  const webhook = process.env.DISCORD_WEBHOOK;
  if (!webhook) {
    console.log("[Discord] No DISCORD_WEBHOOK_KT secret configured. Skipping commit notification.");
    process.exit(0);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  let event = {};

  if (eventPath && fs.existsSync(eventPath)) {
    try {
      event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    } catch (err) {
      console.warn("[Discord] Could not parse GITHUB_EVENT_PATH:", err);
    }
  }

  const actor = process.env.ACTOR || "carlodandan";
  const repo = process.env.REPOSITORY || "carlodandan/KunekTayo";
  const serverUrl = process.env.SERVER_URL || "https://github.com";
  const repoUrl = `${serverUrl}/${repo}`;
  const ciStatus = process.env.CI_STATUS || "success";
  const runId = process.env.RUN_ID || "";
  const runUrl = runId ? `${repoUrl}/actions/runs/${runId}` : `${repoUrl}/actions`;

  const commits = (event.commits && event.commits.length > 0)
    ? event.commits
    : (event.head_commit ? [event.head_commit] : []);

  const totalCommits = commits.length;
  const maxDisplay = 8;
  const displayed = commits.slice(0, maxDisplay);

  let commitListText = "";
  if (displayed.length > 0) {
    commitListText = displayed.map((c) => {
      const shortSha = c.id ? c.id.slice(0, 7) : "unknown";
      const firstLine = (c.message || "").split("\n")[0].trim();
      const author = (c.author && c.author.name) || (event.pusher && event.pusher.name) || actor;
      const url = c.url || `${repoUrl}/commit/${c.id}`;
      return `• [\`${shortSha}\`](${url}) ${firstLine} — *${author}*`;
    }).join("\n");

    if (totalCommits > maxDisplay) {
      commitListText += `\n*...and ${totalCommits - maxDisplay} more commit(s)*`;
    }
  } else {
    const fallbackSha = process.env.SHA ? process.env.SHA.slice(0, 7) : "unknown";
    commitListText = `• [\`${fallbackSha}\`](${repoUrl}/commit/${process.env.SHA || ""}) Update pushed to prod — *${actor}*`;
  }

  const isSuccess = ciStatus === "success";
  const color = isSuccess ? 0x283E7C : 0xED4245; // KunekTayo Navy on success, Red on failure
  const verificationText = isSuccess ? "Passed" : (ciStatus === "failure" ? "Failed" : "Skipped");

  const title = totalCommits > 1
    ? `${totalCommits} New Commits Pushed to prod`
    : (totalCommits === 1 ? "New Commit Pushed to prod" : "Update Pushed to prod");

  const compareUrl = event.compare || (commits[0] ? commits[0].url : runUrl);
  const pusherName = (event.pusher && event.pusher.name) || actor;

  const payload = {
    username: "KunekTayo CI Bot",
    avatar_url: "https://kunektayo.pages.dev/logo.png",
    embeds: [
      {
        title,
        url: compareUrl,
        description: commitListText,
        color,
        fields: [
          {
            name: "Branch",
            value: "`prod`",
            inline: true
          },
          {
            name: "Author / Pusher",
            value: pusherName,
            inline: true
          },
          {
            name: "CI Verification",
            value: verificationText,
            inline: true
          },
          {
            name: "CI Run",
            value: runId ? `[#${runId}](${runUrl})` : "N/A",
            inline: true
          }
        ],
        footer: {
          text: "KunekTayo CI • Ephemeral 1-on-1",
          icon_url: "https://kunektayo.pages.dev/logo.png"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`[Discord] Webhook returned HTTP ${res.status}: ${res.statusText}`);
      process.exit(1);
    }

    console.log("[Discord] Commit notification delivered successfully.");
  } catch (err) {
    console.error("[Discord] Failed to send webhook request:", err);
    process.exit(1);
  }
}

main();
