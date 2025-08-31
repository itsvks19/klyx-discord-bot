import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import express from "express";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
const CHANNEL_ID = process.env.CHANNEL_ID!;
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(DISCORD_TOKEN);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === "ping") {
    await message.reply("Pong!");
  }
});

const app = express();
app.use(express.json());

app.post("/github-webhook", async (req, res) => {
  const payload = req.body;

  if (payload.action === "published") {
    const releaseName: string = payload.release.name;
    const releaseUrl: string = payload.release.html_url;
    const tag: string = payload.release.tag_name;
    let body: string = payload.release.body || "No release notes.";

    if (body.length > 4096) {
      body = body.slice(0, 4093) + "...";
    }

    const channel = client.channels.cache.get(CHANNEL_ID) as
      | TextChannel
      | undefined;
    if (channel && channel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle(`📣 Klyx ${tag}`)
        .setURL(releaseUrl)
        .setDescription(body)
        .setColor("Green")
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log(`Posted new release: ${releaseName}`);
    } else {
      console.warn("Channel not found or bot not in channel.");
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));
