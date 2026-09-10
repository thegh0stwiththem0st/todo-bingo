import { useState } from "react";
import { formatSql, formatXml, makeDelimitedList, type ListDelimiter } from "../lib/developerFormatters";
import { copyText } from "../lib/clipboard";

export function DeveloperUtilitiesTool() {
  const [json, setJson] = useState("");
  const [jsonStatus, setJsonStatus] = useState("");
  const [list, setList] = useState("");
  const [converted, setConverted] = useState("");
  const [xml, setXml] = useState("");
  const [xmlStatus, setXmlStatus] = useState("");
  const [sql, setSql] = useState("");
  const [makerInput, setMakerInput] = useState("");
  const [delimiter, setDelimiter] = useState<ListDelimiter>("comma");
  const [customDelimiter, setCustomDelimiter] = useState(" | ");
  const [makerOutput, setMakerOutput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, value: string) {
    if (await copyText(value)) { setCopied(key); window.setTimeout(() => setCopied((current) => current === key ? null : current), 1500); }
  }

  function formatJson() {
    try {
      setJson(JSON.stringify(JSON.parse(json), null, 2));
      setJsonStatus("JSON formatted.");
    } catch {
      setJsonStatus("That isn't valid JSON yet.");
    }
  }

  function minifyJson() {
    try {
      setJson(JSON.stringify(JSON.parse(json)));
      setJsonStatus("JSON minified.");
    } catch {
      setJsonStatus("That isn't valid JSON yet.");
    }
  }

  function listToArray() {
    const lines = list.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    setConverted(JSON.stringify(lines, null, 2));
  }

  function arrayToList() {
    try {
      const value: unknown = JSON.parse(list);
      if (!Array.isArray(value)) throw new Error();
      setConverted(value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join("\n"));
    } catch {
      setConverted("Enter a valid JSON array to convert it into a list.");
    }
  }

  return (
    <div className="developer-tool">
      <section>
        <h4>JSON formatter</h4>
        <textarea rows={7} aria-label="JSON input" value={json} onChange={(event) => { setJson(event.target.value); setJsonStatus(""); }} placeholder={'{"ready":true}'} spellCheck={false} />
        <div className="utility-actions">
          <button className="button button-secondary" type="button" onClick={formatJson}>Format</button>
          <button className="button button-secondary" type="button" onClick={minifyJson}>Minify</button>
          <button className="button button-secondary" type="button" disabled={!json} onClick={() => copy("json", json)}>{copied === "json" ? "Copied!" : "Copy JSON"}</button>
        </div>
        {jsonStatus && <p className="utility-status" role="status">{jsonStatus}</p>}
      </section>
      <section>
        <h4>XML formatter</h4>
        <textarea rows={7} aria-label="XML input" value={xml} onChange={(event) => { setXml(event.target.value); setXmlStatus(""); }} placeholder="<root><item>Value</item></root>" spellCheck={false} />
        <div className="utility-actions"><button className="button button-secondary" type="button" onClick={() => { try { setXml(formatXml(xml)); setXmlStatus("XML formatted."); } catch { setXmlStatus("That isn't valid XML yet."); } }}>Format XML</button><button className="button button-secondary" type="button" disabled={!xml} onClick={() => copy("xml", xml)}>{copied === "xml" ? "Copied!" : "Copy XML"}</button></div>
        {xmlStatus && <p className="utility-status" role="status">{xmlStatus}</p>}
      </section>
      <section>
        <h4>SQL formatter</h4>
        <textarea rows={7} aria-label="SQL input" value={sql} onChange={(event) => setSql(event.target.value)} placeholder="select id from tasks where complete = true" spellCheck={false} />
        <div className="utility-actions"><button className="button button-secondary" type="button" onClick={() => setSql(formatSql(sql))}>Format SQL</button><button className="button button-secondary" type="button" disabled={!sql} onClick={() => copy("sql", sql)}>{copied === "sql" ? "Copied!" : "Copy SQL"}</button></div>
      </section>
      <section>
        <h4>List ↔ array</h4>
        <textarea rows={5} aria-label="List or array input" value={list} onChange={(event) => setList(event.target.value)} placeholder={'apple\nbanana\ncherry'} spellCheck={false} />
        <div className="utility-actions">
          <button className="button button-secondary" type="button" onClick={listToArray}>List → array</button>
          <button className="button button-secondary" type="button" onClick={arrayToList}>Array → list</button>
        </div>
        {converted && <><textarea rows={5} aria-label="Converted output" value={converted} readOnly /><div className="utility-actions"><button className="button button-secondary" type="button" onClick={() => copy("converted", converted)}>{copied === "converted" ? "Copied!" : "Copy result"}</button></div></>}
      </section>
      <section>
        <h4>List maker</h4>
        <textarea rows={5} aria-label="List maker items" value={makerInput} onChange={(event) => setMakerInput(event.target.value)} placeholder={'apple\nbanana\ncherry'} />
        <div className="delimiter-controls"><label>Delimiter<select value={delimiter} onChange={(event) => setDelimiter(event.target.value as ListDelimiter)}><option value="comma">Comma</option><option value="space">Space</option><option value="dash">-</option><option value="custom">Custom</option></select></label>{delimiter === "custom" && <label>Custom delimiter<input value={customDelimiter} onChange={(event) => setCustomDelimiter(event.target.value)} /></label>}</div>
        <div className="utility-actions"><button className="button button-secondary" type="button" onClick={() => setMakerOutput(makeDelimitedList(makerInput, delimiter, customDelimiter))}>Make list</button></div>
        {makerOutput && <><textarea rows={4} aria-label="Generated list" value={makerOutput} readOnly /><div className="utility-actions"><button className="button button-secondary" type="button" onClick={() => copy("maker", makerOutput)}>{copied === "maker" ? "Copied!" : "Copy list"}</button></div></>}
      </section>
    </div>
  );
}
