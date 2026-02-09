"""
PDF Export Utility
Converts Markdown blog posts to styled PDFs with preserved citations
"""
import re
from datetime import datetime
from io import BytesIO
from typing import Optional

import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from weasyprint import HTML, CSS


def _get_pdf_css() -> str:
    """
    Returns CSS styling for professional blog PDF export
    Preserves citation styling and ensures readability
    """
    return """
        @page {
            size: A4;
            margin: 2.5cm 2cm;
            
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
        }
        
        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 100%;
        }
        
        /* Headers */
        h1 {
            font-size: 28pt;
            font-weight: 700;
            color: #0066cc;
            margin-top: 0;
            margin-bottom: 0.5em;
            line-height: 1.2;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 0.3em;
        }
        
        h2 {
            font-size: 20pt;
            font-weight: 600;
            color: #333;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.2em;
        }
        
        h3 {
            font-size: 16pt;
            font-weight: 600;
            color: #444;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
        }
        
        h4 {
            font-size: 13pt;
            font-weight: 600;
            color: #555;
            margin-top: 1em;
            margin-bottom: 0.3em;
        }
        
        /* Paragraphs */
        p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        /* Links */
        a {
            color: #0066cc;
            text-decoration: none;
        }
        
        /* Lists */
        ul, ol {
            margin-bottom: 1em;
            padding-left: 1.5em;
        }
        
        li {
            margin-bottom: 0.3em;
        }
        
        /* CRITICAL: Citation styling - preserved from original */
        sup {
            font-size: 0.75em;
            font-weight: 700;
            color: #0066cc;
            background-color: #e6f2ff;
            padding: 0.1em 0.3em;
            border-radius: 3px;
            margin-left: 0.1em;
        }
        
        /* Code blocks */
        pre {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 1em;
            overflow-x: auto;
            font-size: 9pt;
            line-height: 1.4;
            margin-bottom: 1em;
        }
        
        code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            background-color: #f5f5f5;
            padding: 0.1em 0.3em;
            border-radius: 3px;
            font-size: 92%;
        }
        
        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 9pt;
        }
        
        /* Blockquotes */
        blockquote {
            border-left: 4px solid #0066cc;
            margin: 1em 0;
            padding-left: 1em;
            color: #555;
            font-style: italic;
            background-color: #f9f9f9;
            padding: 0.5em 1em;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1em;
            font-size: 10pt;
        }
        
        th {
            background-color: #0066cc;
            color: white;
            padding: 0.5em;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            border: 1px solid #ddd;
            padding: 0.5em;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        /* Horizontal rule */
        hr {
            border: none;
            border-top: 2px solid #ddd;
            margin: 2em 0;
        }
        
        /* Metadata header */
        .pdf-header {
            border-bottom: 2px solid #0066cc;
            padding-bottom: 1em;
            margin-bottom: 2em;
        }
        
        .pdf-title {
            font-size: 32pt;
            font-weight: 700;
            color: #0066cc;
            margin: 0 0 0.3em 0;
        }
        
        .pdf-metadata {
            font-size: 9pt;
            color: #666;
            display: flex;
            gap: 1em;
        }
        
        .pdf-metadata-item {
            display: inline-block;
            margin-right: 1.5em;
        }
        
        /* Citations section */
        .citations-section {
            margin-top: 3em;
            padding-top: 1.5em;
            border-top: 2px solid #ddd;
            page-break-before: avoid;
        }
        
        .citations-title {
            font-size: 18pt;
            font-weight: 600;
            color: #333;
            margin-bottom: 1em;
        }
        
        .citation-item {
            margin-bottom: 0.8em;
            padding-left: 1.5em;
            text-indent: -1.5em;
            font-size: 10pt;
        }
        
        .citation-id {
            font-weight: 700;
            color: #0066cc;
            margin-right: 0.5em;
        }
        
        .citation-title {
            font-weight: 600;
        }
        
        .citation-url {
            color: #666;
            font-size: 9pt;
            word-break: break-all;
        }
        
        /* Footer watermark */
        .pdf-footer {
            margin-top: 3em;
            padding-top: 1em;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8pt;
            color: #999;
        }
        
        /* Page breaks */
        h1, h2 {
            page-break-after: avoid;
        }
        
        pre, blockquote, table {
            page-break-inside: avoid;
        }
    """


def _convert_markdown_citations_to_sup(markdown_text: str) -> str:
    """
    Convert [S0], [S1] citations to <sup> tags for better PDF styling
    Preserves stacked citations like [S0][S1]
    """
    # Pattern matches [S#] where # is one or more digits
    pattern = r'\[S(\d+)\]'
    
    # Replace with styled sup tag
    def replacer(match):
        citation_id = match.group(1)
        return f'<sup>[S{citation_id}]</sup>'
    
    return re.sub(pattern, replacer, markdown_text)


def _build_pdf_html(
    blog_markdown: str,
    title: str,
    citations: list[dict],
    metadata: Optional[dict] = None
) -> str:
    """
    Build complete HTML document with metadata, content, and citations
    """
    # Convert citations in markdown to sup tags
    blog_with_sup_citations = _convert_markdown_citations_to_sup(blog_markdown)
    
    # Convert markdown to HTML with extensions
    md = markdown.Markdown(
        extensions=[
            'extra',  # Includes tables, fenced code, etc.
            'codehilite',
            'nl2br',  # Newline to <br>
            'sane_lists'
        ]
    )
    blog_html = md.convert(blog_with_sup_citations)
    
    # Extract title from markdown if not provided
    if not title:
        # Try to get first h1
        h1_match = re.search(r'^#\s+(.+)$', blog_markdown, re.MULTILINE)
        title = h1_match.group(1) if h1_match else "Blog Post"
    
    # Build metadata section
    metadata_html = ""
    if metadata:
        generated_at = metadata.get('generated_at', datetime.now().strftime('%B %d, %Y'))
        tone = metadata.get('tone', '')
        audience = metadata.get('audience', '')
        word_count = metadata.get('word_count', '')
        
        metadata_items = []
        if generated_at:
            metadata_items.append(f'<span class="pdf-metadata-item"><strong>Generated:</strong> {generated_at}</span>')
        if tone:
            metadata_items.append(f'<span class="pdf-metadata-item"><strong>Tone:</strong> {tone.title()}</span>')
        if audience:
            metadata_items.append(f'<span class="pdf-metadata-item"><strong>Audience:</strong> {audience.title()}</span>')
        if word_count:
            metadata_items.append(f'<span class="pdf-metadata-item"><strong>Words:</strong> {word_count:,}</span>')
        
        if metadata_items:
            metadata_html = f'<div class="pdf-metadata">{"".join(metadata_items)}</div>'
    
    # Build citations section
    citations_html = ""
    if citations:
        citation_items = []
        for citation in citations:
            cid = citation.get('id', '')
            ctitle = citation.get('title', 'Unknown Source')
            curl = citation.get('url', '')
            
            url_display = f'<div class="citation-url">{curl}</div>' if curl and curl != 'internal' else ''
            
            citation_items.append(f'''
                <div class="citation-item">
                    <span class="citation-id">{cid}</span>
                    <span class="citation-title">{ctitle}</span>
                    {url_display}
                </div>
            ''')
        
        citations_html = f'''
            <div class="citations-section">
                <h2 class="citations-title">📚 Sources & Citations</h2>
                {"".join(citation_items)}
            </div>
        '''
    
    # Build complete HTML document
    html_document = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>{title}</title>
    </head>
    <body>
        <div class="pdf-header">
            <div class="pdf-title">{title}</div>
            {metadata_html}
        </div>
        
        <div class="blog-content">
            {blog_html}
        </div>
        
        {citations_html}
        
        <div class="pdf-footer">
            Generated by FactFlow AI – Multi-Agent Content Pipeline<br>
            {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
        </div>
    </body>
    </html>
    '''
    
    return html_document


def generate_pdf(
    blog_markdown: str,
    title: Optional[str] = None,
    citations: Optional[list[dict]] = None,
    metadata: Optional[dict] = None
) -> bytes:
    """
    Generate PDF from Markdown blog post with preserved citations
    
    Args:
        blog_markdown: Markdown content with [S#] citations
        title: Blog title (extracted from markdown if not provided)
        citations: List of citation dicts with id, title, url
        metadata: Optional dict with generated_at, tone, audience, word_count
    
    Returns:
        bytes: PDF file content
    
    Example:
        pdf_bytes = generate_pdf(
            blog_markdown="# My Blog\\n\\nThis is great [S0].",
            title="My Amazing Blog",
            citations=[{"id": "S0", "title": "Source", "url": "https://example.com"}],
            metadata={"tone": "professional", "audience": "engineers", "word_count": 1234}
        )
    """
    citations = citations or []
    
    # Build HTML with styling
    html_content = _build_pdf_html(blog_markdown, title, citations, metadata)
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(
        pdf_buffer,
        stylesheets=[CSS(string=_get_pdf_css())]
    )
    
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()


def generate_pdf_from_run_state(run_state: dict) -> bytes:
    """
    Convenience function to generate PDF directly from run state JSON
    
    Args:
        run_state: Complete run state dict (from state.json)
    
    Returns:
        bytes: PDF file content
    """
    # Extract necessary fields
    steps = run_state.get('steps', {})
    config = run_state.get('config', {})
    
    # Get final blog from polish step
    polish_step = steps.get('step4_polish', {})
    blog_markdown = polish_step.get('final_blog', '')
    
    if not blog_markdown:
        raise ValueError("No final blog found in run state. Pipeline may not be complete.")
    
    # Get citations
    citations = run_state.get('citations', [])
    
    # Extract title from markdown
    h1_match = re.search(r'^#\s+(.+)$', blog_markdown, re.MULTILINE)
    title = h1_match.group(1) if h1_match else "Blog Post"
    
    # Build metadata
    metadata = {
        'generated_at': datetime.now().strftime('%B %d, %Y'),
        'tone': config.get('tone', ''),
        'audience': config.get('audience', ''),
        'word_count': len(blog_markdown.split())
    }
    
    return generate_pdf(blog_markdown, title, citations, metadata)
