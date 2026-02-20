"""
PDF generation utility for exported blog posts using Aspose.HTML.
"""
from __future__ import annotations

import html as html_escape
import os
import re
import tempfile
from datetime import datetime
from typing import Optional, Tuple

import aspose.html as aspose_html
import aspose.html.converters as converters
import aspose.html.saving as saving
import markdown


def _format_timestamp(value: str) -> str:
    if not value:
        return "Unknown"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %I:%M %p")
    except Exception:
        return value


def _extract_created_at_from_logs(logs: Optional[list[str]]) -> str:
    if not logs:
        return ""
    first = str(logs[0])
    match = re.match(r"^\[([^\]]+)\]", first)
    if not match:
        return ""
    return match.group(1)


def _extract_title_and_body(markdown_text: str, fallback_title: str) -> Tuple[str, str]:
    text = (markdown_text or "").strip()
    if not text:
        return fallback_title, ""

    lines = text.splitlines()
    idx = 0
    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    if idx < len(lines) and lines[idx].startswith("# "):
        title = lines[idx][2:].strip() or fallback_title
        body = lines[:idx] + lines[idx + 1 :]
        while body and not body[0].strip():
            body.pop(0)
        return title, "\n".join(body)

    return fallback_title, text


def _enhance_citations_in_html(html_text: str) -> str:
    """
    Convert [S0] and grouped forms like [S0, S1] into styled citation chips.
    """

    def repl(match: re.Match[str]) -> str:
        raw = match.group(1)
        source_ids = [part.strip().upper() for part in raw.split(",") if part.strip()]
        chips = "".join(
            f'<span class="citation-ref">{html_escape.escape(source_id)}</span>'
            for source_id in source_ids
        )
        return f'<span class="citation-group">{chips}</span>'

    return re.sub(r"\[((?:[sS]\d+\s*,\s*)*[sS]\d+)\]", repl, html_text)


def _render_metadata_html(run_config: dict, run_id: str, created_at: str) -> str:
    generated = _format_timestamp(created_at)
    topic = html_escape.escape(str(run_config.get("topic") or "Generated Blog"))
    tone = html_escape.escape(str(run_config.get("tone") or "-"))
    audience = html_escape.escape(str(run_config.get("audience") or "-"))
    word_count = html_escape.escape(str(run_config.get("word_count") or "-"))
    run_id_short = html_escape.escape(str(run_id or "unknown")[:12])

    return f"""
    <section class="report-header">
      <div class="report-header-top">
        <div class="report-kicker">ShinraiAI Editorial Report</div>
        <h1 class="report-title">{topic}</h1>
        <div class="report-subtitle">AI-assisted content pipeline output</div>
      </div>
      <div class="report-meta">
        <div class="meta-row"><span class="meta-label">Generated</span><span class="meta-value">{generated}</span></div>
        <div class="meta-row"><span class="meta-label">Run</span><span class="meta-value">{run_id_short}</span></div>
        <div class="meta-row"><span class="meta-label">Tone</span><span class="meta-value">{tone}</span></div>
        <div class="meta-row"><span class="meta-label">Audience</span><span class="meta-value">{audience}</span></div>
        <div class="meta-row"><span class="meta-label">Target Words</span><span class="meta-value">{word_count}</span></div>
      </div>
    </section>
    """


def _render_references_html(citations: Optional[list]) -> str:
    if not citations:
        return ""

    items_html = []
    for citation in citations:
        source_id = html_escape.escape(str(citation.get("id", "S?")))
        title = html_escape.escape(str(citation.get("title", "Untitled source")))
        url = str(citation.get("url", "") or "").strip()

        if not url or url.lower() in {"internal", "n/a"}:
            url_html = '<span class="citation-url">(internal source)</span>'
        else:
            safe_url = html_escape.escape(url)
            url_html = f'<a href="{safe_url}" class="citation-url">{safe_url}</a>'

        items_html.append(
            f"""
            <li class="citation-item">
              <span class="citation-id">{source_id}</span>
              <span class="citation-title">{title}</span>
              {url_html}
            </li>
            """
        )

    return f"""
    <section class="references">
      <h2>References</h2>
      <ol class="citations-list">
        {''.join(items_html)}
      </ol>
    </section>
    """


def _build_html_document(
    *,
    title: str,
    metadata_html: str,
    content_html: str,
    references_html: str,
) -> str:
    safe_title = html_escape.escape(title)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{safe_title}</title>
  <style>
    @page {{
      size: A4;
      margin: 1.8cm 1.6cm 2.0cm 1.6cm;

      @bottom-left {{
        content: "ShinraiAI";
        color: #6b7280;
        font-size: 9pt;
      }}

      @bottom-right {{
        content: counter(page) " / " counter(pages);
        color: #6b7280;
        font-size: 9pt;
      }}
    }}

    :root {{
      --ink: #111827;
      --muted: #4b5563;
      --line: #dbe3ea;
      --paper: #f8fafc;
      --brand: #0f766e;
      --brand-strong: #115e59;
      --brand-soft: #ecfeff;
    }}

    * {{
      box-sizing: border-box;
    }}

    body {{
      margin: 0;
      padding: 0;
      color: var(--ink);
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      background: #ffffff;
    }}

    .report-header {{
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      margin: 0 0 20px 0;
    }}

    .report-header-top {{
      background: linear-gradient(135deg, var(--brand), var(--brand-strong));
      color: #ffffff;
      padding: 18px 20px;
    }}

    .report-kicker {{
      font-size: 8.5pt;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.9;
    }}

    .report-title {{
      margin: 8px 0 0 0;
      font-size: 23pt;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;
    }}

    .report-subtitle {{
      margin-top: 8px;
      font-size: 9.5pt;
      opacity: 0.9;
    }}

    .report-meta {{
      padding: 12px 18px;
      background: var(--paper);
      border-top: 1px solid var(--line);
    }}

    .meta-row {{
      margin: 4px 0;
    }}

    .meta-label {{
      display: inline-block;
      min-width: 105px;
      color: var(--muted);
      font-weight: 600;
      font-size: 9.5pt;
    }}

    .meta-value {{
      color: var(--ink);
      font-size: 9.5pt;
    }}

    .article h1 {{
      font-size: 22pt;
      margin: 0 0 14px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #cfd8df;
      line-height: 1.25;
      color: #0b1220;
    }}

    .article h2 {{
      font-size: 16pt;
      margin: 24px 0 10px 0;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }}

    .article h3 {{
      font-size: 13pt;
      margin: 16px 0 8px 0;
      color: #1f2937;
    }}

    .article p {{
      margin: 0 0 12px 0;
      color: #1f2937;
      text-align: justify;
    }}

    .article ul,
    .article ol {{
      margin: 0 0 12px 0;
      padding-left: 24px;
    }}

    .article li {{
      margin-bottom: 6px;
    }}

    .article blockquote {{
      margin: 14px 0;
      padding: 10px 14px;
      border-left: 4px solid var(--brand);
      background: var(--paper);
      color: #334155;
    }}

    .article code {{
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 2px 5px;
      color: #7f1d1d;
    }}

    .article pre {{
      margin: 12px 0;
      padding: 12px;
      border: 1px solid #d1d9e0;
      border-left: 4px solid var(--brand);
      border-radius: 6px;
      background: #f8fafc;
      overflow-x: auto;
    }}

    .article pre code {{
      border: 0;
      background: transparent;
      color: #0f172a;
      padding: 0;
    }}

    .article table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 14px 0;
      font-size: 10pt;
    }}

    .article th {{
      text-align: left;
      padding: 8px;
      background: #e6f7f6;
      border: 1px solid #c9e6e4;
      color: #0f172a;
    }}

    .article td {{
      padding: 8px;
      border: 1px solid #d8e1e8;
    }}

    .article a {{
      color: #0f766e;
      text-decoration: none;
      border-bottom: 1px solid #99f6e4;
    }}

    .citation-group {{
      display: inline-block;
      margin-left: 2px;
      white-space: nowrap;
    }}

    .citation-ref {{
      display: inline-block;
      padding: 1px 5px;
      margin-left: 3px;
      border: 1px solid #c9ece8;
      border-radius: 10px;
      background: var(--brand-soft);
      color: var(--brand-strong);
      font-size: 8pt;
      font-weight: 700;
      vertical-align: baseline;
    }}

    .references {{
      margin-top: 28px;
      padding-top: 14px;
      border-top: 2px solid #dbe3ea;
    }}

    .references h2 {{
      margin: 0 0 12px 0;
      font-size: 15pt;
      color: #0f172a;
    }}

    .citations-list {{
      margin: 0;
      padding: 0;
      list-style: none;
    }}

    .citation-item {{
      margin: 0 0 10px 0;
      padding: 10px 12px;
      border: 1px solid #dbe5eb;
      border-radius: 8px;
      background: #fbfdff;
    }}

    .citation-id {{
      display: inline-block;
      min-width: 34px;
      margin-right: 6px;
      font-weight: 700;
      color: #0f766e;
    }}

    .citation-title {{
      font-weight: 600;
      color: #1f2937;
    }}

    .citation-url {{
      display: block;
      margin-top: 4px;
      color: #64748b;
      font-size: 9pt;
      word-break: break-all;
      text-decoration: none;
    }}

    .document-note {{
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 9pt;
    }}

    h1, h2, h3, h4 {{
      page-break-after: avoid;
    }}

    pre, blockquote, table, .citation-item {{
      page-break-inside: avoid;
    }}

    p, li {{
      orphans: 3;
      widows: 3;
    }}
  </style>
</head>
<body>
  {metadata_html}
  <main class="article">
    <h1>{safe_title}</h1>
    {content_html}
  </main>
  {references_html}
  <div class="document-note">Generated by ShinraiAI editorial pipeline.</div>
</body>
</html>
"""


def markdown_to_pdf(
    markdown_text: str,
    output_path: str,
    citations: Optional[list] = None,
    run_config: Optional[dict] = None,
    run_id: Optional[str] = None,
    created_at: Optional[str] = None,
) -> None:
    """
    Convert markdown blog post to a polished PDF layout.
    """
    run_config = run_config or {}
    fallback_title = str(run_config.get("topic") or "Generated Blog Post")
    title, body_markdown = _extract_title_and_body(markdown_text, fallback_title)

    md = markdown.Markdown(
        extensions=[
            "extra",
            "fenced_code",
            "tables",
            "nl2br",
            "sane_lists",
            "codehilite",
        ],
        extension_configs={
            "codehilite": {
                "css_class": "highlight",
                "linenums": False,
            }
        },
    )
    content_html = md.convert(body_markdown)
    content_html = _enhance_citations_in_html(content_html)

    metadata_html = _render_metadata_html(
        run_config=run_config,
        run_id=run_id or "unknown",
        created_at=created_at or "",
    )
    references_html = _render_references_html(citations)
    html_content = _build_html_document(
        title=title,
        metadata_html=metadata_html,
        content_html=content_html,
        references_html=references_html,
    )

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".html", delete=False, encoding="utf-8"
    ) as temp_html:
        temp_html.write(html_content)
        temp_html_path = temp_html.name

    try:
        document = aspose_html.HTMLDocument(temp_html_path)
        pdf_options = saving.PdfSaveOptions()
        pdf_options.jpeg_quality = 95
        converters.Converter.convert_html(document, pdf_options, output_path)
    finally:
        if os.path.exists(temp_html_path):
            os.remove(temp_html_path)


def generate_pdf_from_run_state(run_state: dict, output_path: str | None = None) -> bytes:
    """
    Generate a PDF from the run state object and return PDF bytes.
    """
    steps = run_state.get("steps", {})

    final_step = steps.get("final", {})
    final_blog = final_step.get("markdown", "")

    if not final_blog:
        drafts = steps.get("drafts", [])
        if drafts:
            final_blog = drafts[-1].get("text", "")

    if not final_blog:
        raise ValueError("No blog content found in run state")

    citations = run_state.get("citations", [])
    inputs = run_state.get("inputs", {}) or {}
    config = run_state.get("config", {}) or {}
    run_config = {**inputs, **config}
    run_id = run_state.get("run_id", "unknown")
    created_at = run_state.get("created_at") or _extract_created_at_from_logs(run_state.get("logs"))

    cleanup_temp = False
    if not output_path:
        temp_pdf = tempfile.NamedTemporaryFile(mode="wb", suffix=".pdf", delete=False)
        output_path = temp_pdf.name
        temp_pdf.close()
        cleanup_temp = True

    try:
        markdown_to_pdf(
            markdown_text=final_blog,
            output_path=output_path,
            citations=citations,
            run_config=run_config,
            run_id=run_id,
            created_at=created_at,
        )
        with open(output_path, "rb") as file_obj:
            return file_obj.read()
    finally:
        if cleanup_temp and output_path and os.path.exists(output_path):
            os.remove(output_path)
