import { ActionPanel, Action, List, Clipboard, showHUD } from "@raycast/api";
import { useState, useEffect } from "react";

// ——————————————
// TRANSFORMATION UTILITIES
// ——————————————

const toUrlSafe = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .trim()
    .replace(/\s+/g, "-");

const toSentenceCase = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1).toLowerCase();

const capitalizeWords = (text: string) =>
  text.replace(/\b\w/g, (char) => char.toUpperCase());

const removeEmojis = (text: string) =>
  text.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|\u24C2|\uD83C[\uDDE6-\uDDFF]|\uD83C[\uD000-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF])/g,
    ""
  );

const decodeHtmlEntities = (text: string): string => {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
};

const removeHTMLTagsAndEntities = (text: string): string => {
  const noTags = text.replace(/<\/?[^>]+(>|$)/g, "");
  return decodeHtmlEntities(noTags);
};

// ——————————————
// TRANSFORMATION MAPPING
// ——————————————

const transformations: { [label: string]: (text: string) => string } = {
  "URL Safe String": toUrlSafe,
  "Sentence Case": toSentenceCase,
  "Lowercase": (t) => t.toLowerCase(),
  "Capitalize Words": capitalizeWords,
  "Remove Formatting (Plain Text)": (t) => t,
  "Remove Emojis": removeEmojis,
  "Remove HTML Tags": removeHTMLTagsAndEntities,
};

// ——————————————
// RAYCAST COMMAND
// ——————————————

export default function Command() {
  const [clipboardText, setClipboardText] = useState<string>("");

  useEffect(() => {
    Clipboard.readText().then((text) => {
      if (text) setClipboardText(text);
    });
  }, []);

  return (
    <List isLoading={!clipboardText} searchBarPlaceholder="Select a transformation">
      {Object.entries(transformations).map(([label, transform]) => {
        const transformed = transform(clipboardText);
        return (
          <List.Item
            key={label}
            title={label}
            subtitle={transformed}
            actions={
              <ActionPanel>
                <Action
                  title="Copy to Clipboard"
                  onAction={async () => {
                    await Clipboard.copy(transformed);
                    await showHUD(`Copied as ${label}`);
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}