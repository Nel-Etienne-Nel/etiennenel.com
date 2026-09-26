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

## Using it: a NAS, from box to wiki

The operations make more sense followed through one real change, so here's one. A few months in, the home-lab wiki already has pages for the Proxmox host, the reverse proxy and the backup strategy. Then I add a NAS.

### Day one: ingest the setup notes

While setting the NAS up I keep rough notes, the way anyone does: half sentences, commands I ran, things to remember. When it's done, that file goes into the inbox as it is. It's a raw source now, so nobody tidies it.

```markdown {file="99 - Inbox/NAS setup notes.md"}
nas setup 14 sep
- 4 bay, TrueNAS SCALE 24.10, hostname nas01, static ip 10.0.0.20
- 4x 8TB, RAIDZ1 pool "tank" (~21TB usable)
- datasets: tank/media, tank/backups, tank/photos
- SMB shares for media + photos, NFS export tank/backups -> proxmox
- snapshots nightly 02:00, keep 14
- TODO move proxmox backups here instead of the usb drive
- remember: pool is 80% = slow, don't fill it
```

Then one line in Claude Code:

```text {file="Claude Code"}
Ingest the NAS setup notes from the inbox.
```

Claude reads `index.md` first. There's no NAS page yet, so one gets written. But the notes also touch pages that already exist, and one of them now disagrees: **Backup Strategy** still says backups go to a USB drive on the Proxmox host. Claude doesn't guess which is true. It asks:

```text {file="Claude Code"}
Your notes say Proxmox backups should move to the NAS (tank/backups over
NFS), but Backup Strategy says they go to the USB drive on the Proxmox host.
Has the move happened, or is it still a TODO?

> Still a TODO. Record the plan, keep the USB drive as current.
```

So Backup Strategy keeps the USB drive as the current target and gains a "Planned" section pointing at the NAS. That's the difference from a folder of notes: the conflict gets noticed and resolved once, at filing time, instead of surfacing months later when a restore fails. Here's everything the one ingest touched:

{{< tree title="home-lab/ after ingesting the NAS notes" >}}
home-lab/
├── index.md (M)                               # NAS and File Shares listed
├── log.md (M)
├── 00 - Hardware/
│   ├── NAS.md (+)                             # the machine: disks, pool, network
│   └── Proxmox Host.md (M)                    # NFS mount of tank/backups
├── 01 - Services/
│   ├── Backup Strategy.md (M)                 # "Planned": move to the NAS
│   └── File Shares.md (+)                     # SMB and NFS, who uses what
└── 99 - Inbox/
    └── NAS setup notes.md                     # untouched: sources are never edited
{{< /tree >}}

The rough notes became a proper page with frontmatter, facts in one place and links out to everything related:

```markdown {file="00 - Hardware/NAS.md"}
---
type: machine
last_updated: 2026-09-14
tags: [nas, storage, truenas]
source: "[[NAS setup notes]]"
---

# NAS

| Hostname | nas01, 10.0.0.20 |
| OS       | TrueNAS SCALE 24.10 |
| Pool     | tank: 4 × 8 TB, RAIDZ1, ~21 TB usable |
| Datasets | media, backups, photos |

Shares are documented in [[File Shares]]. Nightly snapshots at 02:00, 14 kept.
Keep the pool under 80% full: ZFS slows down sharply past that.
Planned: take over Proxmox backups, see [[Backup Strategy]].
```

And the log gets one line, so the next session knows what happened:

```text {file="home-lab/log.md"}
2026-09-14 | ingest | NAS setup notes: new [[NAS]] and [[File Shares]]; Proxmox Host gains the NFS mount; Backup Strategy gains a Planned move to the NAS (confirmed: USB drive still current).
```

### A week later: something to add to it

I read a good article on ZFS scrubs and clip it into the inbox. This time the wiki has somewhere to put it:

```text {file="Claude Code"}
Ingest "ZFS scrubbing explained".
```

Claude writes a **ZFS Scrubs** runbook, adds a monthly scrub schedule to the NAS page, and links it from Backup Strategy, because a scrub before a big change is part of doing backups properly. The article didn't mention my NAS at all. The wiki made the connection.

```markdown {file="02 - Runbooks/ZFS Scrubs.md"}
---
type: runbook
last_updated: 2026-09-21
tags: [zfs, storage, maintenance]
source: "[[ZFS scrubbing explained]]"
---

# ZFS Scrubs

A scrub reads every block in a pool and repairs anything that fails its
checksum. On the [[NAS]], run one monthly on `tank`, and always before a
change covered in [[Backup Strategy]].
```

### Two months later: ask it something

A disk starts throwing errors and I want to swap all four for bigger ones. Instead of digging through notes:

```text {file="Claude Code"}
What do I need to check before I upgrade the NAS disks?
```

Claude reads the index, then the pages it points to, and answers from all three: the pool is RAIDZ1, so disks get replaced one at a time with a resilver in between (**NAS**); run a scrub first so a weak disk fails now rather than mid-resilver (**ZFS Scrubs**); and confirm last night's backup, which still lands on the USB drive because the move never happened (**Backup Strategy**). None of those pages says all of that. The answer only exists because the pages are linked.

Then it offers to save the answer as a **Replacing NAS Disks** runbook. I say yes, and the next disk swap starts from a checklist instead of a search.

## Keeping it healthy

### Lint: a health check

Every so often, ask for a lint. Claude checks the whole wiki and reports back before changing anything:

| Issue | Location | Severity | Fix |
|---|---|---|---|
| Orphaned page | `01 - Services/DNS.md` | Medium | Link it from Reverse Proxy |
| Index drift | `Camera NVR.md` was added by hand, not in `index.md` | Low | Add the row |
| Stale claim | `Proxmox Host.md`: "latest version is 8.1" | Medium | Re-check and date it |
| Stale plan | `Backup Strategy.md`: move to the NAS "Planned" for 60 days | Low | Do it, or drop the plan |
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
