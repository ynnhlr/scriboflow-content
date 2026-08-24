# Scriboflow Help content

The Help Center is a bilingual Markdown collection consumed by the Scriboflow
application. English and Danish articles use the same category and article
slugs:

```text
help/
  en/{category}/{slug}.md
  da/{category}/{slug}.md
```

## Frontmatter

Every article must start with validated YAML frontmatter:

```yaml
---
title: "Article title"
description: "A short result-oriented summary."
category: "getting-started"
slug: "article-slug"
order: 1
keywords:
  - "search phrase"
lastUpdated: "2026-08-24"
relatedArticles:
  - "another-article-slug"
---
```

The Markdown body must not be empty. `slug` must match the filename, and
`category` must match the parent directory. Every slug must have both an
English and Danish version. Related slugs must exist, must not refer to the
current article, and are displayed in the listed order.

## Categories

- `getting-started`
- `creating-and-managing-contracts`
- `templates-and-the-editor`
- `sending-and-signing`
- `team-members-and-permissions`
- `subscription-billing-and-usage-limits`
- `security-privacy-and-data`
- `troubleshooting`
- `frequently-asked-questions`

Content changes are normally published from `main`. The Scriboflow GitHub
webhook invalidates the Help Center cache, and pages otherwise refresh every
15 minutes.
