import DOMPurify from 'dompurify';

export interface SanitizedHtmlResult {
  sanitizedHtml: string;
  srcDoc: string;
  warnings: string[];
  sizeBytes: number;
}

const MAX_HTML_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB limit for safety

/**
 * Strips potentially hazardous parent-escape patterns from inline script blocks
 * inside educational HTML notes. Note that the primary isolation boundary is
 * `<iframe sandbox="allow-scripts">` WITHOUT `allow-same-origin`, which gives
 * the iframe an opaque null origin so it cannot access parent DOM, cookies,
 * localStorage, or auth tokens.
 */
function neutralizeScriptEscapes(scriptBody: string, warnings: string[]): string {
  const blockedPatterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /\bwindow\s*\.\s*top\b/gi, label: 'window.top reference' },
    { regex: /\bwindow\s*\.\s*parent\b/gi, label: 'window.parent reference' },
    { regex: /\btop\s*\.\s*location\b/gi, label: 'top.location redirect' },
    { regex: /\bparent\s*\.\s*location\b/gi, label: 'parent.location redirect' },
    { regex: /\bdocument\s*\.\s*cookie\b/gi, label: 'document.cookie access' },
    { regex: /\blocalStorage\b/gi, label: 'localStorage access' },
    { regex: /\bsessionStorage\b/gi, label: 'sessionStorage access' },
    { regex: /\bwindow\s*\.\s*open\s*\(/gi, label: 'window.open call' },
  ];

  let cleaned = scriptBody;
  for (const { regex, label } of blockedPatterns) {
    if (regex.test(cleaned)) {
      warnings.push(`Blocked restricted script call (${label}) for sandbox safety.`);
      cleaned = cleaned.replace(regex, 'undefined /* blocked */');
    }
  }
  return cleaned;
}

/**
 * Sanitizes uploaded HTML content while preserving educational styling, CSS animations,
 * SVG/Canvas interactive explanations, tables, math formulas, and code blocks.
 * Never executes uploaded JS in the main app context.
 */
export function sanitizeEducationalHtml(rawHtml: string): SanitizedHtmlResult {
  const warnings: string[] = [];
  const trimmed = (rawHtml || '').trim();

  if (!trimmed) {
    return {
      sanitizedHtml: '',
      srcDoc: buildSandboxedSrcDoc('<p>No HTML content provided.</p>', 'Empty Note'),
      warnings: ['Uploaded HTML file is empty.'],
      sizeBytes: 0,
    };
  }

  const sizeBytes = new Blob([trimmed]).size;
  if (sizeBytes > MAX_HTML_SIZE_BYTES) {
    warnings.push(
      `HTML size (${(sizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds the 2 MB recommendation.`
    );
  }

  // Extract inline <style> and safe inline <script> blocks before DOMPurify cleans the markup,
  // while blocking external script src loads, iframes, objects, embeds, and meta redirects.
  const preservedStyles: string[] = [];
  const preservedScripts: string[] = [];

  let working = trimmed;

  // Strip dangerous meta refresh, base tags, objects, embeds, applets, nested iframes
  const dangerousTags = [
    { regex: /<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, name: 'meta refresh redirect' },
    { regex: /<base\b[^>]*>/gi, name: '<base> tag' },
    { regex: /<iframe\b[\s\S]*?<\/iframe>|<iframe\b[^>]*\/?>/gi, name: 'nested <iframe>' },
    { regex: /<object\b[\s\S]*?<\/object>|<object\b[^>]*\/?>/gi, name: '<object> tag' },
    { regex: /<embed\b[^>]*\/?>/gi, name: '<embed> tag' },
    { regex: /<applet\b[\s\S]*?<\/applet>/gi, name: '<applet> tag' },
  ];

  for (const item of dangerousTags) {
    if (item.regex.test(working)) {
      warnings.push(`Removed disallowed ${item.name} for security.`);
      working = working.replace(item.regex, '');
    }
  }

  // Extract <style> blocks
  working = working.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, css: string) => {
    const safeCss = css.replace(/@import\s+url\s*\(\s*['"]?\s*javascript:/gi, '/* blocked */');
    preservedStyles.push(safeCss);
    return '';
  });

  // Extract inline <script> blocks (block external src scripts to prevent remote untrusted code)
  working = working.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (_match, attrs: string, body: string) => {
      if (/\bsrc\s*=/i.test(attrs)) {
        warnings.push('Stripped external <script src="..."> tag; only inline interactive scripts are permitted inside the sandbox.');
        return '';
      }
      const cleanedScript = neutralizeScriptEscapes(body, warnings);
      if (cleanedScript.trim()) {
        preservedScripts.push(cleanedScript);
      }
      return '';
    }
  );

  // Extract body inner content if a complete HTML document was uploaded
  const bodyMatch = working.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const bodySource = bodyMatch ? bodyMatch[1] : working;

  // Sanitize HTML body structure with DOMPurify (preserves SVG, MathML, tables, images, data attributes, inline style)
  const cleanBody =
    typeof window !== 'undefined'
      ? DOMPurify.sanitize(bodySource, {
          USE_PROFILES: { html: true, svg: true, svgFilters: true, mathMl: true },
          ADD_TAGS: ['canvas', 'details', 'summary', 'figure', 'figcaption', 'mark', 'time', 'kbd', 'samp'],
          ADD_ATTR: [
            'style',
            'class',
            'id',
            'data-*',
            'viewBox',
            'preserveAspectRatio',
            'aria-label',
            'role',
            'colspan',
            'rowspan',
            'width',
            'height',
            'open',
            'type',
            'min',
            'max',
            'step',
            'value',
            'placeholder',
            'checked',
          ],
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet', 'base', 'link', 'meta', 'form'],
          FORBID_ATTR: ['formaction', 'xlink:href'],
          ALLOW_DATA_ATTR: true,
        })
      : bodySource
          .replace(/<script\b[\s\S]*?<\/script>/gi, '')
          .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Reassemble sanitized canonical HTML string stored in database
  const styleBlock =
    preservedStyles.length > 0 ? `<style>\n${preservedStyles.join('\n\n')}\n</style>\n` : '';
  const scriptBlock =
    preservedScripts.length > 0 ? `\n<script>\n${preservedScripts.join('\n\n')}\n</script>` : '';

  const sanitizedHtml = `${styleBlock}${cleanBody}${scriptBlock}`.trim();
  const srcDoc = buildSandboxedSrcDoc(sanitizedHtml);

  return {
    sanitizedHtml,
    srcDoc,
    warnings: Array.from(new Set(warnings)),
    sizeBytes: new Blob([sanitizedHtml]).size,
  };
}

/**
 * Wraps sanitized HTML in a responsive HTML5 document with a strict Content-Security-Policy
 * designed for rendering inside `<iframe sandbox="allow-scripts">` (opaque null origin).
 */
export function buildSandboxedSrcDoc(sanitizedHtml: string, title = 'Study Notes'): string {
  const safeTitle = title.replace(/[<>&"']/g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https:; script-src 'unsafe-inline'; img-src data: https: blob:; font-src data: https:; media-src data: https:;" />
  <title>${safeTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      overflow-wrap: break-word;
    }
    body {
      padding: 24px 28px 40px;
      max-width: 100%;
    }
    img, svg, canvas, video {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      display: block;
      overflow-x: auto;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    @media (max-width: 640px) {
      body { padding: 16px; }
    }
  </style>
</head>
<body>
${sanitizedHtml}
</body>
</html>`;
}
