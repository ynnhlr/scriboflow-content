import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, "..");
const templatesRoot = path.join(repositoryRoot, "templates");

const localeConfigs = [
  { directoryName: "EN", locale: "en" },
  { directoryName: "DA", locale: "da" },
];

const checkMode = process.argv.includes("--check");
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const updatedAtPattern = /^\d{4}-\d{2}-\d{2}$/;
const versionPattern = /^\d+\.\d+$/;
const frontmatterBlockPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;
const maxTemplateTagsPerLocale = 10;

function normalizeScalarValue(value) {
  const trimmedValue = value.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1).trim();
  }

  return trimmedValue;
}

function parseInlineArray(value) {
  const rawValue = value.trim();

  if (!rawValue.startsWith("[") || !rawValue.endsWith("]")) {
    throw new Error("Invalid inline array syntax.");
  }

  const body = rawValue.slice(1, -1).trim();

  if (body.length === 0) {
    return [];
  }

  return body
    .split(",")
    .map((item) => normalizeScalarValue(item))
    .filter((item) => item.length > 0);
}

function parseYamlFrontmatterBlock(frontmatterBlock, sourcePath) {
  const lines = frontmatterBlock.split(/\r?\n/);
  const parsed = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      index += 1;
      continue;
    }

    const keyValueMatch = /^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/.exec(line);

    if (!keyValueMatch) {
      throw new Error(`Invalid frontmatter line in ${sourcePath}: ${line}`);
    }

    const [, key, rawValue = ""] = keyValueMatch;
    const trimmedValue = rawValue.trim();

    if (key === "tags") {
      if (trimmedValue.length > 0) {
        parsed.tags = parseInlineArray(trimmedValue);
        index += 1;
        continue;
      }

      const tags = [];
      index += 1;

      while (index < lines.length) {
        const listItemMatch = /^\s*-\s+(.+)$/.exec(lines[index]);

        if (!listItemMatch) {
          break;
        }

        tags.push(normalizeScalarValue(listItemMatch[1]));
        index += 1;
      }

      parsed.tags = tags.filter((tag) => tag.length > 0);
      continue;
    }

    parsed[key] = normalizeScalarValue(trimmedValue);
    index += 1;
  }

  return parsed;
}

function parseTemplateFrontmatter(fileContent, sourcePath) {
  const frontmatterMatch = frontmatterBlockPattern.exec(fileContent);

  if (!frontmatterMatch) {
    throw new Error(`Missing YAML frontmatter in ${sourcePath}.`);
  }

  const frontmatter = parseYamlFrontmatterBlock(frontmatterMatch[1], sourcePath);
  const issues = [];

  if (typeof frontmatter.slug !== "string" || frontmatter.slug.length === 0) {
    issues.push("slug is required");
  } else if (!slugPattern.test(frontmatter.slug)) {
    issues.push("slug must use kebab-case");
  }

  if (frontmatter.language !== "en" && frontmatter.language !== "da") {
    issues.push("language must be either en or da");
  }

  if (frontmatter.primaryJurisdiction !== "DK") {
    issues.push("primaryJurisdiction must be DK");
  }

  if (
    typeof frontmatter.updatedAt !== "string" ||
    !updatedAtPattern.test(frontmatter.updatedAt)
  ) {
    issues.push("updatedAt must use YYYY-MM-DD format");
  }

  if (
    typeof frontmatter.version !== "string" ||
    !versionPattern.test(frontmatter.version)
  ) {
    issues.push("version must use major.minor format");
  }

  if (typeof frontmatter.title !== "string" || frontmatter.title.length === 0) {
    issues.push("title is required");
  }

  if (
    typeof frontmatter.description !== "string" ||
    frontmatter.description.length === 0
  ) {
    issues.push("description is required");
  }

  if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
    issues.push("tags must be a non-empty array");
  }

  if (
    frontmatter.seoTitle !== undefined &&
    (typeof frontmatter.seoTitle !== "string" || frontmatter.seoTitle.length === 0)
  ) {
    issues.push("seoTitle must be a non-empty string when provided");
  }

  if (
    frontmatter.seoDescription !== undefined &&
    (
      typeof frontmatter.seoDescription !== "string" ||
      frontmatter.seoDescription.length === 0
    )
  ) {
    issues.push("seoDescription must be a non-empty string when provided");
  }

  if (issues.length > 0) {
    throw new Error(`Invalid frontmatter in ${sourcePath}: ${issues.join("; ")}.`);
  }

  return {
    slug: frontmatter.slug,
    language: frontmatter.language,
    primaryJurisdiction: frontmatter.primaryJurisdiction,
    updatedAt: frontmatter.updatedAt,
    version: frontmatter.version,
    title: frontmatter.title,
    description: frontmatter.description,
    tags: [...new Set(frontmatter.tags)],
    ...(frontmatter.seoTitle ? { seoTitle: frontmatter.seoTitle } : {}),
    ...(frontmatter.seoDescription
      ? { seoDescription: frontmatter.seoDescription }
      : {}),
  };
}

async function readExistingManifest(manifestPath) {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function withoutGeneratedAt(manifest) {
  const { generatedAt: _generatedAt, ...rest } = manifest;
  return rest;
}

function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function manifestsMatchExcludingGeneratedAt(left, right) {
  return stringifyJson(withoutGeneratedAt(left)) === stringifyJson(withoutGeneratedAt(right));
}

async function buildLocaleManifest(localeConfig) {
  const directoryPath = path.join(templatesRoot, localeConfig.directoryName);
  const manifestPath = path.join(directoryPath, "manifest.json");
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  const markdownFiles = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));
  const existingManifest = await readExistingManifest(manifestPath);
  const slugTracker = new Set();
  const templates = [];

  for (const fileName of markdownFiles) {
    const absolutePath = path.join(directoryPath, fileName);
    const repositoryPath = path
      .relative(repositoryRoot, absolutePath)
      .split(path.sep)
      .join("/");
    const frontmatter = parseTemplateFrontmatter(
      await fs.readFile(absolutePath, "utf8"),
      repositoryPath,
    );

    if (frontmatter.language !== localeConfig.locale) {
      throw new Error(
        `Template ${repositoryPath} declares language "${frontmatter.language}" but is stored under locale "${localeConfig.locale}".`,
      );
    }

    if (slugTracker.has(frontmatter.slug)) {
      throw new Error(
        `Duplicate slug "${frontmatter.slug}" found in ${localeConfig.directoryName}.`,
      );
    }

    slugTracker.add(frontmatter.slug);

    templates.push({
      ...frontmatter,
      contentPath: repositoryPath,
    });
  }

  templates.sort((left, right) => left.slug.localeCompare(right.slug, "en"));

  const nextManifest = {
    locale: localeConfig.locale,
    generatedAt: new Date().toISOString(),
    templates,
  };

  if (
    existingManifest &&
    manifestsMatchExcludingGeneratedAt(existingManifest, nextManifest)
  ) {
    nextManifest.generatedAt = existingManifest.generatedAt;
  }

  return {
    localeConfig,
    manifest: nextManifest,
    manifestPath,
  };
}

function assertLocaleTagLimit(localeManifest) {
  const tagsByNormalizedValue = new Map();

  for (const template of localeManifest.manifest.templates) {
    for (const tag of template.tags) {
      const normalizedTag = tag.trim().toLocaleLowerCase(localeManifest.manifest.locale);

      if (!tagsByNormalizedValue.has(normalizedTag)) {
        tagsByNormalizedValue.set(normalizedTag, tag.trim());
      }
    }
  }

  if (tagsByNormalizedValue.size > maxTemplateTagsPerLocale) {
    throw new Error(
      `Locale "${localeManifest.manifest.locale}" uses ${tagsByNormalizedValue.size} unique tags. ` +
        `Maximum allowed is ${maxTemplateTagsPerLocale}. Tags: ${[
          ...tagsByNormalizedValue.values(),
        ].join(", ")}.`,
    );
  }
}

function assertMatchingLocalizedSlugs(localeManifests) {
  const slugsByLocale = new Map(
    localeManifests.map((localeManifest) => [
      localeManifest.manifest.locale,
      new Set(localeManifest.manifest.templates.map((template) => template.slug)),
    ]),
  );
  const allSlugs = new Set();

  for (const slugSet of slugsByLocale.values()) {
    for (const slug of slugSet) {
      allSlugs.add(slug);
    }
  }

  const missingMessages = [];

  for (const slug of [...allSlugs].sort((left, right) => left.localeCompare(right, "en"))) {
    for (const [locale, slugSet] of slugsByLocale.entries()) {
      if (!slugSet.has(slug)) {
        missingMessages.push(`${slug} missing from ${locale}`);
      }
    }
  }

  if (missingMessages.length > 0) {
    throw new Error(`Localized template slug mismatch: ${missingMessages.join("; ")}.`);
  }
}

async function writeOrCheckManifest(localeManifest) {
  const nextContent = stringifyJson(localeManifest.manifest);

  if (checkMode) {
    let currentContent = null;

    try {
      currentContent = await fs.readFile(localeManifest.manifestPath, "utf8");
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }

    if (currentContent !== nextContent) {
      throw new Error(
        `${path.relative(repositoryRoot, localeManifest.manifestPath)} is not up to date.`,
      );
    }

    return;
  }

  await fs.writeFile(localeManifest.manifestPath, nextContent, "utf8");
}

async function main() {
  const localeManifests = await Promise.all(localeConfigs.map(buildLocaleManifest));

  for (const localeManifest of localeManifests) {
    assertLocaleTagLimit(localeManifest);
  }

  assertMatchingLocalizedSlugs(localeManifests);

  for (const localeManifest of localeManifests) {
    await writeOrCheckManifest(localeManifest);
  }

  const summary = localeManifests
    .map(
      (localeManifest) =>
        `${localeManifest.manifest.locale}: ${localeManifest.manifest.templates.length}`,
    )
    .join(", ");

  console.log(
    checkMode
      ? `Template manifests are up to date (${summary}).`
      : `Generated template manifests (${summary}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
