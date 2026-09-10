export async function copyText(value: string, writeText: (value: string) => Promise<void> = (text) => navigator.clipboard.writeText(text)) {
  if (!value) return false;
  try { await writeText(value); return true; } catch { return false; }
}
