// HealthOps v7 Parser API client helper
// Use in the PWA to send one or more PDFs to the Python parser.

const HEALTHOPS_PARSER_API_URL = localStorage.getItem('healthops_parser_api_url') || 'http://127.0.0.1:8000';

async function parseRosterWithApi(files) {
  const form = new FormData();
  Array.from(files).forEach(file => form.append('files', file, file.name));
  const res = await fetch(`${HEALTHOPS_PARSER_API_URL}/parse-roster`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Parser API falhou: ${res.status} ${text}`);
  }
  return await res.json();
}

window.HealthOpsParserApi = { parseRosterWithApi, HEALTHOPS_PARSER_API_URL };
