---
name: discord
description: Discord outbound messaging — send/post is a one-way door.
---

# Discord skill (stub)

## Triggers

- discord, webhook, post message, notify channel

## Constraints

- **Red:** send/post/publish to Discord requires explicit approval
- Draft locally; attach receipt when message sent
- No token storage in Otto config

## Autonomy

- `discord.read`: green
- `discord.send`: red
