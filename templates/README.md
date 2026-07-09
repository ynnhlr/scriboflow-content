# Template Manifests

The Scriboflow app reads template metadata from locale manifests so it does not
need to fetch every markdown file to render template listings.

The generated files are:

- `templates/EN/manifest.json`
- `templates/DA/manifest.json`

Each manifest is generated from markdown frontmatter and contains listing/detail
metadata only. It does not include full template body content.

Run this after adding or editing templates:

```bash
node scripts/generate-template-manifests.mjs
```

Use check mode in CI or before pushing:

```bash
node scripts/generate-template-manifests.mjs --check
```

The generator validates required frontmatter, duplicate slugs, EN/DA slug
coverage, and the current 10-tag-per-locale limit used by the Scriboflow app.
