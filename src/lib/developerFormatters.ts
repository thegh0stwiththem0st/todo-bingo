export function formatXml(input: string) {
  const source = input.trim();
  if (!source) return "";
  const tokens = source.match(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g);
  if (!tokens || tokens.join("") !== source) throw new Error("Invalid XML");
  const lines: string[] = [];
  const stack: string[] = [];
  let depth = 0;
  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;
    const closing = /^<\/\s*([\w:.-]+)\s*>$/.exec(token);
    const opening = /^<\s*([\w:.-]+)(?:\s[^>]*)?>$/.exec(token);
    const special = /^<\?|^<!|\/>$/.test(token);
    if (closing) {
      if (stack.pop() !== closing[1]) throw new Error("Mismatched XML tags");
      depth = Math.max(0, depth - 1);
      lines.push(`${"  ".repeat(depth)}${token}`);
    } else if (opening && !special) {
      lines.push(`${"  ".repeat(depth)}${token}`);
      stack.push(opening[1]);
      depth += 1;
    } else if (token.startsWith("<")) {
      lines.push(`${"  ".repeat(depth)}${token}`);
    } else {
      if (stack.length === 0) throw new Error("Text outside the root element");
      lines.push(`${"  ".repeat(depth)}${token.replace(/\s+/g, " ")}`);
    }
  }
  if (stack.length) throw new Error("Unclosed XML tag");
  return lines.join("\n");
}

export function formatSql(input: string) {
  const strings: string[] = [];
  let sql = input.trim().replace(/'(?:''|[^'])*'|"(?:""|[^"])*"/g, (value) => `§${strings.push(value) - 1}§`);
  sql = sql.replace(/\s+/g, " ");
  const phrases = ["LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN", "GROUP BY", "ORDER BY", "UNION ALL", "INSERT INTO", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET", "VALUES", "UPDATE", "SET", "UNION", "JOIN", "ON", "AND", "OR"];
  const pattern = new RegExp(`\\b(${phrases.join("|")})\\b`, "gi");
  sql = sql.replace(pattern, (word) => word.toUpperCase());
  sql = sql.replace(/\s+(?=(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION(?: ALL)?|(?:LEFT |RIGHT |FULL |INNER )?(?:OUTER )?JOIN|INSERT INTO|DELETE FROM|UPDATE|VALUES)\b)/g, "\n");
  sql = sql.replace(/\s+(AND|OR)\s+/g, "\n  $1 ");
  sql = sql.replace(/§(\d+)§/g, (_match, index) => strings[Number(index)]);
  return sql;
}

export type ListDelimiter = "comma" | "space" | "dash" | "custom";

export function makeDelimitedList(input: string, delimiter: ListDelimiter, custom = "") {
  const items = input.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const separators: Record<Exclude<ListDelimiter, "custom">, string> = { comma: ", ", space: " ", dash: "-" };
  return items.join(delimiter === "custom" ? custom : separators[delimiter]);
}
