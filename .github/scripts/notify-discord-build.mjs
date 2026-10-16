/**
 * notify-discord-build.mjs
 * Sends a build completion status report to Discord via incoming webhook.
 */

async function main() {
  const webhook = process.env.DISCORD_WEBHOOK;
  if (!webhook) {
    console.log("[Discord] No DISCORD_WEBHOOK_KT secret configured. Skipping build notification.");
    process.exit(0);
  }

  const winStatus = process.env.WINDOWS_STATUS || "skipped";
  const androidStatus = process.env.ANDROID_STATUS || "skipped";
  const refName = process.env.REF_NAME || "prod";
  const refType = process.env.REF_TYPE || "branch";
  const sha = process.env.SHA || "";
  const actor = process.env.ACTOR || "carlodandan";
  const runId = process.env.RUN_ID || "";
  const repo = process.env.REPOSITORY || "carlodandan/KunekTayo";
  const serverUrl = process.env.SERVER_URL || "https://github.com";

  const isSuccess = winStatus === "success" && androidStatus === "success";

  const formatStatus = (s) => {
    switch (s) {
      case "success":
        return "Passed";
      case "failure":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Skipped";
    }
  };

  const shortSha = sha ? sha.slice(0, 7) : "";
  const runUrl = runId ? `${serverUrl}/${repo}/actions/runs/${runId}` : `${serverUrl}/${repo}/actions`;
  const commitUrl = sha ? `${serverUrl}/${repo}/commit/${sha}` : `${serverUrl}/${repo}`;

  const title = isSuccess ? "Build Succeeded" : "Build Failed";
  const color = isSuccess ? 0x283E7C : 0xED4245; // KunekTayo Navy on success, Red on failure
  const description = `Production release build finished on **${refName}** (${refType}).`;

  const payload = {
    username: "KunekTayo Build Bot",
    avatar_url: "https://kunektayo.pages.dev/logo.png",
    embeds: [
      {
        title,
        url: runUrl,
        description,
        color,
        fields: [
          {
            name: "Windows Build",
            value: formatStatus(winStatus),
            inline: true
          },
          {
            name: "Android APK",
            value: formatStatus(androidStatus),
            inline: true
          },
          {
            name: "Branch / Tag",
            value: `\`${refName}\``,
            inline: true
          },
          {
            name: "Triggered By",
            value: actor,
            inline: true
          },
          {
            name: "Commit",
            value: shortSha ? `[\`${shortSha}\`](${commitUrl})` : "N/A",
            inline: true
          },
          {
            name: "Workflow Run",
            value: runId ? `[#${runId}](${runUrl})` : "N/A",
            inline: true
          }
        ],
        footer: {
          text: "KunekTayo Pipeline • Ephemeral 1-on-1",
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

    console.log("[Discord] Build notification delivered successfully.");
  } catch (err) {
    console.error("[Discord] Failed to send webhook request:", err);
    process.exit(1);
  }
}

main();
