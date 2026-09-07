import { useState } from "react";
import { convertCase, type CaseStyle } from "../lib/caseConverter";

const styles: Array<[CaseStyle, string]> = [["upper", "UPPER"], ["lower", "lower"], ["title", "Title"], ["sentence", "Sentence"], ["camel", "camelCase"], ["pascal", "PascalCase"], ["snake", "snake_case"], ["kebab", "kebab-case"], ["constant", "CONSTANT_CASE"], ["dot", "dot.case"]];
export function CaseConverterTool() {
  const [source, setSource] = useState(""); const [result, setResult] = useState(""); const [copied, setCopied] = useState(false);
  async function copy() { if (!result) return; await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
  return <div className="case-tool"><label>Original text<textarea rows={4} value={source} onChange={(event) => setSource(event.target.value)} placeholder="Paste or type text…" /></label><div className="case-buttons">{styles.map(([id, label]) => <button type="button" key={id} onClick={() => setResult(convertCase(source, id))}>{label}</button>)}</div><label>Converted text<textarea rows={4} value={result} onChange={(event) => setResult(event.target.value)} placeholder="Choose a conversion" /></label><div className="tool-actions"><button className="button button-primary" type="button" disabled={!result} onClick={copy}>{copied ? "Copied!" : "Copy"}</button><button className="button button-secondary" type="button" onClick={() => { setSource(""); setResult(""); }}>Clear</button></div></div>;
}
