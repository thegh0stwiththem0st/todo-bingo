import { describe, expect, it } from "vitest";
import { formatSql, formatXml, makeDelimitedList } from "./developerFormatters";

describe("developer formatters", () => {
  it("indents XML and rejects mismatched tags", () => {
    expect(formatXml("<root><item>One</item></root>")).toBe("<root>\n  <item>\n    One\n  </item>\n</root>");
    expect(() => formatXml("<root><item></root>")).toThrow(/Mismatched/);
  });

  it("formats common SQL clauses without changing quoted strings", () => {
    const output = formatSql("select id from users where name = 'select from' and active = 1 order by id");
    expect(output).toContain("SELECT id\nFROM users\nWHERE");
    expect(output).toContain("'select from'");
    expect(output).toContain("\nORDER BY id");
  });

  it("joins cleaned lines using preset and custom delimiters", () => {
    expect(makeDelimitedList("apple\n banana \n\ncherry", "comma")).toBe("apple, banana, cherry");
    expect(makeDelimitedList("a\nb", "custom", " | ")).toBe("a | b");
  });
});
