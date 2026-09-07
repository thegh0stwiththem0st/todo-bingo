export type CaseStyle = "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "constant" | "dot";

export function tokenize(value: string) {
  return value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim().split(/\s+/).filter(Boolean);
}

export function convertCase(value: string, style: CaseStyle) {
  if (style === "upper") return value.toLocaleUpperCase();
  if (style === "lower") return value.toLocaleLowerCase();
  const words = tokenize(value).map((word) => word.toLocaleLowerCase());
  if (words.length === 0) return "";
  const cap = (word: string) => word.charAt(0).toLocaleUpperCase() + word.slice(1);
  if (style === "title") return words.map(cap).join(" ");
  if (style === "sentence") return cap(words.join(" "));
  if (style === "camel") return words[0] + words.slice(1).map(cap).join("");
  if (style === "pascal") return words.map(cap).join("");
  if (style === "snake") return words.join("_");
  if (style === "kebab") return words.join("-");
  if (style === "constant") return words.join("_").toLocaleUpperCase();
  return words.join(".");
}
