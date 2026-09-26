---
title: "T-001 - A Wiki That Claude Maintains"
date: 2026-09-26
draft: true
---

Most of what I know about my own projects doesn't live in my head any more. It lives in Obsidian, in wikis that Claude writes and I read. This post covers the idea behind that, why I work this way, and how to set up the same thing with a Claude Code plugin I've published.

## The idea is Karpathy's

The pattern comes from Andrej Karpathy's [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) gist. His starting point is how most of us use an LLM with documents: you hand it files, it pulls out the relevant pieces when you ask a question, and it answers. That works, but nothing accumulates. Ask something that needs five documents combined and it re-does the combining every time.

His alternative is to have the LLM **compile** what it reads into a wiki: a folder of interlinked Markdown pages that it keeps up to date. A new source doesn't just get stored for later. It gets read, summarised, and worked into the pages that already exist, with cross-references added and contradictions noted. The knowledge is built once and maintained, instead of rediscovered on every question.

He splits it into three layers:

- **Raw sources**: the articles, notes and documents you collect. The LLM reads them and never changes them.
- **The wiki**: the pages the LLM writes and owns.
- **The schema**: a file like `CLAUDE.md` that tells the LLM how this wiki is organised and how to work on it. You shape it together over time.

And he sums up the roles in one line: "Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."

The gist is deliberately abstract. It describes the pattern and leaves the folder layout, conventions and tooling to you. What follows is my version.

## Why I use it

I keep eight of these wikis: business strategy, each side project, the technical books I'm working through, and personal study. Three things keep me on it.

**It's memory between sessions.** A new Claude Code session has no idea what we decided last week. Pointed at a wiki, it reads the schema, the index and the recent log, and picks up where we left off. I stop re-explaining my own projects.

**The log keeps the reasoning, not just the result.** Every session appends what changed and why, including where I disagreed and what we settled on. Months later I can see why a decision was made, not only that it was.

**The maintenance is free.** Wikis die because keeping them current is tedious: updating links, fixing summaries, noticing that page A now contradicts page B. That's exactly the part Claude does without complaint, so the wiki stays alive.

## What the plugin adds

Karpathy's gist is the pattern. The plugin, [llm-wiki](https://github.com/Nel-Etienne-Nel/llm-wiki), is the set of conventions I settled on, written down as a Claude Code skill so every session follows them.

**Three files in every wiki.** `CLAUDE.md` is the schema. `index.md` is a catalogue with one line per page, and it's the first thing Claude reads before touching anything. `log.md` is an append-only diary, one `YYYY-MM-DD | action | detail` line per session.

**Numbered folders.** Every folder is named `NN - Name/`. Low numbers hold curated, checked knowledge. The highest number is the inbox, where raw and unverified material lands before it's promoted.

**Five operations**, each with fixed steps: `setup`, `ingest`, `query`, `lint` and `fix-meta`. They're covered below.

**House rules.** Obsidian `[[links]]` instead of Markdown links, YAML frontmatter on every page, check the index before creating anything, update pages in place instead of duplicating, never edit a raw source, never skip the log.

## Setting it up

{{< steps >}}
1. **Have an Obsidian vault.** Any folder of Markdown files opened in Obsidian works. Each wiki is one folder inside it.

2. **Install the plugin in Claude Code.** Add the marketplace, then install:

   ```text {file="Claude Code"}
   /plugin marketplace add Nel-Etienne-Nel/llm-wiki
   /plugin install llm-wiki@llm-wiki
   ```

3. **Open Claude Code in your vault** and ask it to set up a wiki.

   ```console
   $ cd ~/Vault
   $ claude
   ```

   ```text {file="Claude Code"}
   /llm-wiki:wiki setup home-lab
   ```

   You don't need the slash command. "Set up a wiki for my home lab" triggers the same skill. It confirms the folder, then asks what the wiki is for so it can write the schema.

4. **Check the result.** For a home-lab wiki you get something like this:

   {{< tree title="home-lab/" >}}
home-lab/
├── CLAUDE.md                  # the schema
├── index.md                   # one line per page
├── log.md                     # append-only
├── 00 - Hardware/
├── 01 - Services/
├── 02 - Runbooks/
└── 99 - Inbox/                # raw material lands here
   {{< /tree >}}
{{< /steps >}}

The schema is the file worth reading closely. It's plain Markdown, and you should edit it whenever the wiki's rules change:

```markdown {file="home-lab/CLAUDE.md" hl="7-10"}
# Home Lab — Schema

Everything about the home lab: hardware, the services running on it,
and how to fix it when it breaks.

## What goes where
| 00 - Hardware | One page per machine: specs, disks, where it sits |
| 01 - Services | One page per service: what it does, config, dependencies |
| 02 - Runbooks | Step-by-step fixes, written after something broke |
| 99 - Inbox    | Clipped articles and raw notes. Never edited. |

## Rules
- Title Case file names. One topic per page.
- Every page links to at least one other page.
```

{{< tip >}}
Keep the vault in git. The wiki is just Markdown, so you get a full history of every change Claude makes, and an easy undo, for free.
{{< /tip >}}

## Using it

### Ingest: add something new

Drop a source in the inbox and tell Claude to file it. Say I clip an article on ZFS scrubbing into `99 - Inbox/`:

```text {file="Claude Code"}
Ingest "ZFS scrubbing explained" from the inbox.
```

Claude reads `index.md` first to see what already exists. It finds that the NAS and backup pages cover related ground, so it updates those in place instead of starting fresh, and writes one new runbook for the part that didn't exist yet:

{{< tree title="home-lab/ after the ingest" >}}
home-lab/
├── index.md (M)                          # new runbook listed
├── log.md (M)                            # one line for this session
├── 00 - Hardware/
│   └── NAS.md (M)                        # scrub schedule added
├── 01 - Services/
│   └── Backup Strategy.md (M)            # links to the new runbook
├── 02 - Runbooks/
│   └── ZFS Scrubs.md (+)
└── 99 - Inbox/
    └── ZFS scrubbing explained.md        # untouched: sources are never edited
{{< /tree >}}

One source touched five files. That's the point: the knowledge is spread into the places you'll look for it, not left as one more document in a pile. The new page gets frontmatter and links back to the pages it relates to:

```markdown {file="02 - Runbooks/ZFS Scrubs.md"}
---
type: runbook
last_updated: 2026-09-26
tags: [zfs, storage, maintenance]
---

# ZFS Scrubs

A scrub reads every block in the pool and repairs anything that fails
its checksum. Run one monthly on the [[NAS]], and before any change
covered in [[Backup Strategy]].
```

And the log gets its line:

```text {file="home-lab/log.md"}
2026-09-26 | ingest | "ZFS scrubbing explained": new [[ZFS Scrubs]] runbook; NAS gains a monthly scrub schedule; Backup Strategy links to it.
```

### Query: ask it something

Ask a question and Claude answers from the wiki, reading the curated folders first and combining pages where it needs to:

```text {file="Claude Code"}
What do I need to check before I upgrade the NAS disks?
```

If the answer pulled several pages together, it offers to file it back as a new page. A good answer shouldn't disappear into chat history. Next time, it's already in the wiki.

### Lint: a health check

Every so often, ask for a lint. Claude checks the whole wiki and reports back before changing anything:

| Issue | Location | Severity | Fix |
|---|---|---|---|
| Orphaned page | `01 - Services/DNS.md` | Medium | Link it from Reverse Proxy |
| Index drift | `ZFS Scrubs.md` not in `index.md` | Low | Add the row |
| Stale claim | `Proxmox Host.md`: "latest version is 8.1" | Medium | Re-check and date it |
| Unprocessed inbox | 3 items older than 30 days | Low | Ingest or dismiss |

It also looks for broken links, pages missing their meta-files, counts that no longer match, and claims with no source. You say which fixes to apply.

### Fix-meta: adopt an existing folder

Already have a folder full of notes? `fix-meta` reads what's there and writes the missing `CLAUDE.md`, `index.md` and `log.md` around it, so the folder can join the system without being rebuilt.

{{< warning >}}
Claude writes the wiki, so read what it files, especially in the first weeks. The schema is where you correct its habits: when it does something you don't want, add a rule to `CLAUDE.md` rather than fixing the page by hand, and it won't happen again.
{{< /warning >}}

## Get it

- The plugin: [github.com/Nel-Etienne-Nel/llm-wiki](https://github.com/Nel-Etienne-Nel/llm-wiki), MIT licensed.
- The idea: Andrej Karpathy's [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). Read it first. It's short, and it covers ground this post skips, like search tools for when a wiki outgrows its index.
