---
title: "T-002 - Give your agent a map"
date: 2026-10-11
vault_source: "T-002.2 - Give your agent a map.md"
seoTitle: "Give your agent a map: CLAUDE.md and context files"
description: "Every agent session starts blank. How I give Claude Code a map with CLAUDE.md and context files, so it finds the right file without searching."
---

Why does an AI agent spend the start of every session poking around my folders as if it's never seen them? Because it hasn't. Every session starts with an empty context window: no memory of yesterday, no idea where anything is. [T-001](/technical/t-001-a-wiki-that-claude-maintains/) was about where the knowledge lives. This one is about getting the agent to the right file without making it search, and why the obvious fixes don't work.

I'll use Claude Code as the worked example, because it's what I use every day and its loading rules are documented. The idea isn't specific to Claude, though. It's how I design every agent I build: give it a map at launch, and let it go straight to what it needs.

## The problem

An agent dropped into a folder without a map does what anyone does in a stranger's folder. It lists directories, searches for file names, opens whatever looks promising, and guesses. Every one of those steps is a tool call, and every result lands in the context window. On a big project, a good part of the session goes on finding things before any real work starts.

That costs time and tokens, and it fills the context with directory listings and files that turned out to be the wrong ones. Sometimes it also ends wrong: the agent edits the old copy of a file, reads a folder name as meaning something it doesn't, or treats a half-finished experiment as the live version.

The fix is to tell the agent where things are, in a file it reads before it starts looking. Then it reads one small file, goes straight to the folder it needs, and skips the search.

The catch is that an agent only reads some files without being asked.

## What gets read without asking

Every coding agent has a short list of files it loads at launch. Everything else it only reads if it decides to. For Claude Code:

| File | When Claude reads it |
|---|---|
| `~/.claude/CLAUDE.md` | Every session, in every project. Your personal rules. |
| `CLAUDE.md` in the folder you start in, and in every folder above it | At launch |
| `CLAUDE.md` in a folder below where you started | Only once Claude reads, writes or edits a file in that folder |
| Files imported with `@path` from a loaded `CLAUDE.md` | At launch, along with the file that imports them |
| `.claude/rules/` files with a `paths:` field | Only when Claude works on a matching file |
| Auto memory (the `MEMORY.md` index) | The first 200 lines (or 25KB) at launch. The notes it lists are read when they're relevant. |
| Skills | Names and descriptions at launch. The full instructions when a skill is used. |
| Everything else: `README.md`, `CONTEXT.md`, your notes | Only if something points to it, or Claude happens to open it |

Other agents differ in the details. Most of them read an `AGENTS.md` at the project root, and Claude Code reads one too when there's no `CLAUDE.md`. Check your own tool's docs for its list. The shape is the same everywhere: a few files load at launch, and everything else waits until the agent goes looking.

Why so few? Because anything loaded at launch sits in the context window for the whole session, taking room from the actual work. So the tool loads a small set up front and everything else only when it's needed. Once you see that, the rest of this post follows: your job is to put one small, precise pointer in that first set.

The row that matters is the third one. A `CLAUDE.md` deeper in the tree does load, but only after Claude has already decided to work there. That makes it fine for rules about the code in that folder, and useless for helping Claude choose where to go. Path-scoped rules have the same timing: they load once Claude touches a matching file, which is after the choice has been made.

I learned that the hard way. For a while I kept a `CLAUDE.md` map in every folder. They arrived too late to steer anything, and each one was another file that drifted out of date.

So the only file you can count on reaching the agent is the launch file at the top of the project. Everything else has to be routed from there.

## Why not load everything at launch?

If the root file can import other files, why not import every folder's notes and be done with it? Because imports load at launch. Every folder's context would sit in every session, including the twenty folders that have nothing to do with today's task. That's the cost the map exists to avoid.

The map has to be small enough to load every time, and specific enough that the agent reads one folder's notes, not all of them.

> So the work splits in two: one small file that always loads and points the way, and a file in each folder that only loads when the agent goes there. A third covers anything outside the project. 
> 
> That’s the whole setup.
## Three files

1. CLAUDE.md
**The map, at the project root.** `CLAUDE.md` for Claude Code, `AGENTS.md` for most other agents. If you use more than one agent, keep the map in `AGENTS.md` and make `CLAUDE.md` a single line, `@AGENTS.md`, so every agent reads the same map. It holds what the project is, a tree of the folders with one line on each, a table of common tasks and where they live, and what to ignore. It also carries one standing rule: *before you work in a folder, read its `CONTEXT.md`*. Because Claude also loads the `CLAUDE.md` in every folder above the one you start in, that rule still applies when you open Claude deep inside a subfolder.

That rule is a request, not a guarantee. Claude Code treats `CLAUDE.md` as context, not enforced configuration. Short, specific instructions like this one are the kind it follows most reliably, but if you need it enforced, that's what hooks are for.

2. **`CONTEXT.md`, in each folder that needs explaining.** Two sections:

- **What's here.** Stable: what the folder is for, what's in it, and what someone would wrongly assume.
- **Now.** Dated: what's being worked on, what's next, what's undecided.

3. **`REFERENCES.md`, only where something external exists.** Services, APIs, where the credential files are and which keys they hold. Locations only, never the secret values.

Splitting stable from changing content is the important design choice. **What's here** stays true for months. **Now** goes stale in days. Kept in one block, an old status makes the whole file look untrustworthy. Kept apart, with a date on **Now**, the agent can tell exactly how old the status is and trust the rest.

When a **Now** section grows into a full tracker, with phases and checklists, it moves to a `STATUS.md` next to the `CONTEXT.md` and **Now** keeps a one-line pointer. Most folders never need one.

## Where memory and skills fit

These files don't replace memory or skills. Each file answers a different question:

| Question | Where the answer lives |
|---|---|
| Where is it? | The root map (`CLAUDE.md` or `AGENTS.md`) |
| What's going on in this folder? | `CONTEXT.md` |
| What does it connect to? | `REFERENCES.md` |
| What did we decide, and how do I like things done? | Memory |
| How is this kind of task done properly? | A skill |

Memory is about you and your decisions, across every project. A skill is a procedure. The map is about this folder, today. If a fact would be wrong in another project, it belongs in the map or a `CONTEXT.md`, not in memory.

## An example

Here's a made-up project: the online shop for a small coffee roaster, Kettle & Co.

{{< tree title="kettle-co/" >}}
kettle-co/
├── CLAUDE.md                  # the map, loaded at launch
├── REFERENCES.md              # Shopify, domain, analytics
├── shop/
│   └── CONTEXT.md             # Shopify theme
├── order-bot/
│   ├── CONTEXT.md             # WhatsApp bot that answers order questions
│   ├── REFERENCES.md          # its API keys live in .env
│   └── prompts/
├── brand/
│   └── CONTEXT.md             # logos, fonts, packaging
├── wholesale/
│   └── CONTEXT.md             # cafe accounts and price lists
└── archive/                   # retired work, listed under Ignore
{{< /tree >}}

The root map is short. Its job is to send the agent somewhere, not to explain everything:

CLAUDE.md 
```markdown {file="kettle-co/CLAUDE.md" hl="7-9"}
# Kettle & Co — online shop and order bot

## What this is
The web shop and WhatsApp order bot for Kettle & Co, a two-person coffee
roaster. Wholesale is handled by hand; only the price lists live here.

## Before you work in a folder
Read that folder's CONTEXT.md first (and its REFERENCES.md if it has one).
Don't infer current status from this file.

## Folder structure
kettle-co/
├── shop/        ← Shopify theme — see shop/CONTEXT.md
├── order-bot/   ← WhatsApp order bot — see order-bot/CONTEXT.md
├── brand/       ← Logos, fonts, packaging — see brand/CONTEXT.md
├── wholesale/   ← Cafe accounts, price lists — see wholesale/CONTEXT.md
└── archive/     ← Retired work (ignore)

## Where to find what
| Want to...                     | Go to       | Read first            |
|--------------------------------|-------------|-----------------------|
| Change the shop's look         | shop/       | shop/CONTEXT.md       |
| Change what the bot says       | order-bot/  | order-bot/CONTEXT.md  |
| Update a cafe's prices         | wholesale/  | wholesale/CONTEXT.md  |
```

And a folder's `CONTEXT.md` holds the detail, including the dated status:

```markdown {file="order-bot/CONTEXT.md" hl="14-18"}
# Order bot — answers order questions on WhatsApp

## What's here
The bot customers message about their orders. It looks orders up in
Shopify and answers delivery questions. It can't change an order:
anything like that goes to a person.

| Path              | What it is                            |
|-------------------|---------------------------------------|
| prompts/v3.md     | The system prompt in use              |
| prompts/old/      | Earlier prompts, kept for comparison  |
| REFERENCES.md     | Services and where the keys are       |

## Now
**Updated:** 2026-10-05
- **Working on:** answers about delivery times to rural areas
- **Next:** hand over to a person when a customer is upset
- **Open:** whether to answer wholesale questions here at all
```

A new session asked to "make the bot friendlier" reads the root map, follows it to `order-bot/CONTEXT.md`, finds the prompt in use, and knows what's already in progress. Two small files read, no searching.

## A map isn't a directory listing

Claude Code's `/doctor` check will suggest trimming directory layouts out of `CLAUDE.md`, on the grounds that Claude can work them out from the codebase. For a raw listing, it's right: pasting `ls` output into your map tells the agent nothing it couldn't find itself.

A map is different. Each line says what a folder is *for* and which file to read first, and that's exactly what the agent can't know without opening things. If the trim check flags your map, keep the meaning and drop anything that's only structure.

## Setting it up

You can write these files by hand: the format above is all there is to it. I use a Claude Code plugin, [workspace-mapper](https://github.com/Nel-Etienne-Nel/workspace-mapper), so that every session writes them the same way.

{{< steps >}}
1. **Install the plugin.** Add the marketplace, then install:

   ```text {file="Claude Code"}
   /plugin marketplace add Nel-Etienne-Nel/workspace-mapper
   /plugin install workspace-mapper@workspace-mapper
   ```

2. **Open Claude Code at the project root** and ask for a map.

   ```console
   $ cd ~/Projects/kettle-co
   $ claude
   ```

   ```text {file="Claude Code"}
   Map this directory.
   ```

3. **Answer one round of questions.** It scans the folders first, then asks only what it couldn't work out: what unclear folders are for, the common tasks, what's being worked on in each folder (that fills the **Now** sections), and what to ignore.

4. **Review the drafts before anything is written.** It shows the root `CLAUDE.md` and each `CONTEXT.md` and `REFERENCES.md` it plans to create, and writes them once you've corrected them.
{{< /steps >}}

For a project that doesn't exist yet, ask it to "set up a new project folder" instead. It proposes the folders, creates them with their files once you agree, and adds the new folder to the parent project's map so it isn't missed.

{{< tip >}}
If you already have `CLAUDE.md` files in subfolders, the plugin offers to convert them: the map content moves into the folder's `CONTEXT.md` under **What's here**, and the root map gains a line routing to it.
{{< /tip >}}

## Maps drift

This is the part I didn't expect. Writing the map is easy. Keeping it true is the actual work, because projects keep moving and the map doesn't move with them.

Why does that happen? Because a map is a second copy of the structure, written down somewhere else. The folders change when you work; the map only changes when someone remembers to change it. Nothing forces the two copies to move together.

A few months on, the Kettle & Co files have drifted in the usual ways:

- **A folder was renamed.** `shop/` became `store/` when the theme was rebuilt. The map still says `shop/`.
- **A file moved on.** The bot's prompt is on `v4.md` now. Its `CONTEXT.md` still names `prompts/v3.md`.
- **A new folder was never routed.** Someone added `subscriptions/` for monthly coffee boxes, with a perfectly good `CONTEXT.md`, but nobody added it to the root map, so nothing ever tells the agent to read it.
- **A status went stale.** `brand/CONTEXT.md` says "Working on: new bag labels". The labels were printed in November.
- **A skill was renamed.** The map says to deploy the theme with a `ship-theme` skill. It's called `theme-deploy` now.

A wrong map is worse than none. Without a map, the agent searches and finds what's there. With a wrong map, it trusts the map: it looks for a folder that isn't there, edits a prompt that's no longer used, or picks up "new bag labels" as live work. That's every bit of the search cost you were trying to save, plus a wrong answer at the end.

Three habits keep it in check.

**Date the Now section, every time it changes.** A stale status with a date is useful: the agent can see it's four months old and ask. A stale status without one reads as current.

**Keep status out of the map.** If you're about to write "currently working on" in `CLAUDE.md`, it belongs in a **Now** section. The map should only change when the structure changes.

**Run a check.** The plugin has a check mode that compares the files against what's on disk. On the drifted example:

```console
$ python3 scan_directory.py kettle-co --check --no-tree

Drift check
===========

Broken paths (named in a doc, missing on disk): 2
  - CLAUDE.md → `shop`
  - order-bot/CONTEXT.md → `prompts/v3.md`

Unrouted (CONTEXT.md that no map points to): 1
  - subscriptions/CONTEXT.md: not mentioned in CLAUDE.md

Stale or undated (older than 30 days): 2
  - brand/CONTEXT.md: Now last updated 2026-10-02 (136 days ago)
  - subscriptions/CONTEXT.md: Now section has no date

5 finding(s). Heuristic — read each one before changing anything.
```

Or just ask Claude to "check the workspace docs" and it runs this, explains each finding, and proposes fixes for you to approve.

Claude Code's own `/doctor prompt-audit` overlaps with part of this: it looks for references to files and commands that don't exist. What it doesn't know about is the convention, whether every `CONTEXT.md` is routed from the map and whether each **Now** section is dated and how old it is. I run both.

The first time I ran the check on my own main work folder, it found 16 paths that no longer existed, mostly folders I'd moved and forgotten the map still pointed at. Every one of those was a dead end an agent would have walked into.

{{< warning >}}
The check only catches what it can verify on disk: paths, routing, dates. It can't tell that `ship-theme` is now `theme-deploy`, or that a description has quietly stopped being true. Read your maps now and then, and when you move or rename something with your agent, ask it to update the map in the same session, while it still knows what changed.
{{< /warning >}}

## Underneath

Strip this post down and it's one idea: an agent's attention is the scarcest thing in the session. It can't know what it hasn't loaded, and everything it loads costs room. A map is the smallest thing that tells it where to look. Every rule here, the root file, the dated **Now**, the drift check, exists to spend that attention well.

## Get it

- The plugin: [github.com/Nel-Etienne-Nel/workspace-mapper](https://github.com/Nel-Etienne-Nel/workspace-mapper), MIT licensed.
- How Claude Code loads these files, from the source: [How Claude remembers your project](https://code.claude.com/docs/en/memory).
- Where the knowledge itself goes: [T-001 - A Wiki That Claude Maintains](/technical/t-001-a-wiki-that-claude-maintains/).
