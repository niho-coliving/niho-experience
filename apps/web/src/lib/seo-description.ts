/** Keep a complete sentence when it fits, otherwise finish at a word boundary. */
export function seoDescription(lead: string): string {
  const text = lead.replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  const prefix = text.slice(0, 159);
  const sentenceEnds = [...prefix.matchAll(/[.!?](?=\s|$)/g)];
  const sentenceEnd = sentenceEnds.at(-1)?.index;
  if (sentenceEnd !== undefined && sentenceEnd >= 80) return prefix.slice(0, sentenceEnd + 1);
  const wordEnd = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, wordEnd > 0 ? wordEnd : 159).trimEnd()}…`;
}
