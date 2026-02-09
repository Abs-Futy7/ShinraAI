"""
PDF generation utility for blog posts with styled citations.
"""
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import re
from typing import Optional
from datetime import datetime


PDF_CSS = """
@page {
    size: A4;
    margin: 2.5cm 2cm;
    
    @top-center {
        content: "FactFlow AI - Generated Blog Post";
        font-size: 9pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #64748b;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1e293b;
    max-width: 100%;
    margin: 0;
    padding: 0;
}

/* Headings */
h1 {
    font-size: 28pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 0.5rem;
}

h2 {
    font-size: 20pt;
    font-weight: 600;
    color: #1e293b;
    margin-top: 2rem;
    margin-bottom: 1rem;
    line-height: 1.3;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.3rem;
}

h3 {
    font-size: 16pt;
    font-weight: 600;
    color: #334155;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
}

h4, h5, h6 {
    font-size: 13pt;
    font-weight: 600;
    color: #475569;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
}

/* Paragraphs */
p {
    margin-bottom: 1rem;
    text-align: justify;
}

/* Lists */
ul, ol {
    margin-bottom: 1rem;
    padding-left: 2rem;
}

li {
    margin-bottom: 0.5rem;
}

/* Links */
a {
    color: #2563eb;
    text-decoration: none;
    border-bottom: 1px solid #93c5fd;
}

/* Code blocks */
pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
    overflow-x: auto;
    margin-bottom: 1rem;
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    line-height: 1.4;
}

code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9.5pt;
    background-color: #f1f5f9;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    color: #e11d48;
}

pre code {
    background-color: transparent;
    padding: 0;
    color: #1e293b;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1.5rem;
    font-size: 10pt;
}

thead {
    background-color: #f1f5f9;
    font-weight: 600;
}

th, td {
    border: 1px solid #e2e8f0;
    padding: 0.5rem 0.75rem;
    text-align: left;
}

th {
    color: #0f172a;
}

tr:nth-child(even) {
    background-color: #f8fafc;
}

/* Blockquotes */
blockquote {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 1rem;
    color: #475569;
    font-style: italic;
    background-color: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 0 4px 4px 0;
}

/* Horizontal rule */
hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 2rem 0;
}

/* Citations - styled as superscript with blue color */
sup.citation {
    color: #2563eb;
    font-weight: 600;
    font-size: 9pt;
    margin-left: 0.1rem;
}

/* Citations section */
.citations-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 3px solid #e2e8f0;
    page-break-before: auto;
}

.citations-section h2 {
    color: #0f172a;
    border-bottom: 2px solid #3b82f6;
}

.citation-item {
    margin-bottom: 1rem;
    padding-left: 2rem;
    text-indent: -2rem;
}

.citation-id {
    color: #2563eb;
    font-weight: 700;
    margin-right: 0.5rem;
}

.citation-title {
    font-weight: 600;
    color: #1e293b;
}

.citation-url {
    color: #64748b;
    font-size: 9pt;
    word-break: break-all;
}

/* Metadata header */
.metadata {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 2rem;
    font-size: 9.5pt;
}

.metadata-row {
    display: flex;
    margin-bottom: 0.3rem;
}

.metadata-label {
    font-weight: 600;
    color: #475569;
    margin-right: 0.5rem;
}

.metadata-value {
    color: #1e293b;
}

/* Page breaks */
.page-break {
    page-break-after: always;
}

/* Prevent orphans and widows */
p, li {
    orphans: 3;
    widows: 3;
}

h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
}
"""


def enhance_citations_in_markdown(markdown_text: str) -> str:
    """
    Convert [S#] citation format to styled superscript for PDF.
    
    Example: [S1] -> <sup class="citation">[S1]</sup>
    """
    # Replace [S#] with styled superscript
    enhanced = re.sub(
        r'\[S(\d+)\]',
        r'<sup class="citation">[S\1]</sup>',
        markdown_text
    )
    return enhanced


def generate_metadata_html(run_config: dict, run_id: str, created_at: str) -> str:
    """
    Generate metadata header section for PDF.
    """
    # Format the created_at timestamp
    try:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        formatted_date = dt.strftime("%B %d, %Y at %I:%M %p")
    except:
        formatted_date = created_at
    
    metadata_html = f"""
    <div class="metadata">
        <div class="metadata-row">
            <span class="metadata-label">Run ID:</span>
            <span class="metadata-value">{run_id}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Generated:</span>
            <span class="metadata-value">{formatted_date}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Tone:</span>
            <span class="metadata-value">{run_config.get('tone', 'N/A')}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Target Audience:</span>
            <span class="metadata-value">{run_config.get('audience', 'N/A')}</span>
        </div>
        <div class="metadata-row">
            <span class="metadata-label">Word Count Target:</span>
            <span class="metadata-value">{run_config.get('word_count', 'N/A')}</span>
        </div>
    </div>
    """
    return metadata_html


def generate_citations_html(citations: list) -> str:
    """
    Generate citations section HTML for PDF.
    """
    if not citations:
        return ""
    
    citations_html = """
    <div class="citations-section">
        <h2>📚 References</h2>
    """
    
    for citation in citations:
        citation_id = citation.get('id', 'N/A')
        title = citation.get('title', 'Untitled')
        url = citation.get('url', 'N/A')
        
        # Format URL display
        if url == 'internal' or url == 'N/A':
            url_display = '<span class="citation-url">(Internal source)</span>'
        else:
            url_display = f'<a href="{url}" class="citation-url">{url}</a>'
        
        citations_html += f"""
        <div class="citation-item">
            <span class="citation-id">{citation_id}</span>
            <span class="citation-title">{title}</span><br>
            {url_display}
        </div>
        """
    
    citations_html += "</div>"
    return citations_html


def markdown_to_pdf(
    markdown_text: str,
    output_path: str,
    citations: Optional[list] = None,
    run_config: Optional[dict] = None,
    run_id: Optional[str] = None,
    created_at: Optional[str] = None
) -> None:
    """
    Convert markdown blog post to styled PDF with preserved citations.
    
    Args:
        markdown_text: Blog post in Markdown format with [S#] citations
        output_path: Output file path for PDF
        citations: List of citation objects with id, title, url
        run_config: Run configuration metadata
        run_id: Unique run identifier
        created_at: Timestamp of run creation
    """
    # Enhance citations in markdown
    enhanced_markdown = enhance_citations_in_markdown(markdown_text)
    
    # Convert markdown to HTML
    md = markdown.Markdown(
        extensions=[
            'extra',           # Tables, def lists, etc.
            'codehilite',      # Syntax highlighting
            'fenced_code',     # ``` code blocks
            'nl2br',           # Newline to <br>
            'sane_lists',      # Better list handling
        ],
        extension_configs={
            'codehilite': {
                'css_class': 'highlight',
                'linenums': False
            }
        }
    )
    
    blog_html = md.convert(enhanced_markdown)
    
    # Build complete HTML document
    html_content = "<!DOCTYPE html>\n<html>\n<head>\n"
    html_content += '<meta charset="UTF-8">\n'
    html_content += '<title>FactFlow AI - Blog Post</title>\n'
    html_content += '</head>\n<body>\n'
    
    # Add metadata section if provided
    if run_config and run_id and created_at:
        html_content += generate_metadata_html(run_config, run_id, created_at)
    
    # Add blog content
    html_content += blog_html
    
    # Add citations section if provided
    if citations:
        html_content += generate_citations_html(citations)
    
    html_content += "\n</body>\n</html>"
    
    # Generate PDF with WeasyPrint
    font_config = FontConfiguration()
    html_doc = HTML(string=html_content)
    css = CSS(string=PDF_CSS, font_config=font_config)
    
    html_doc.write_pdf(
        output_path,
        stylesheets=[css],
        font_config=font_config
    )


def generate_pdf_from_run_state(run_state: dict, output_path: str = None) -> bytes:
    """
    Generate PDF from complete run state object.
    
    Args:
        run_state: Complete run state dictionary from state.json
        output_path: Optional output file path for PDF (if None, returns bytes)
    
    Returns:
        bytes: PDF content as bytes
    """
    # Extract final blog post
    steps = run_state.get('steps', {})
    
    # Try to get from final step (polish completed)
    final_step = steps.get('final', {})
    final_blog = final_step.get('markdown', '')
    
    if not final_blog:
        # Fallback to last draft if polish didn't complete
        drafts = steps.get('drafts', [])
        if drafts:
            final_blog = drafts[-1].get('text', '')
    
    if not final_blog:
        raise ValueError("No blog content found in run state")
    
    # Extract metadata
    citations = run_state.get('citations', [])
    run_config = run_state.get('config', {})
    run_id = run_state.get('run_id', 'unknown')
    created_at = run_state.get('created_at', 'unknown')
    
    # Enhance citations in markdown
    enhanced_markdown = enhance_citations_in_markdown(final_blog)
    
    # Convert markdown to HTML
    md = markdown.Markdown(
        extensions=[
            'extra',           # Tables, def lists, etc.
            'codehilite',      # Syntax highlighting
            'fenced_code',     # ``` code blocks
            'nl2br',           # Newline to <br>
            'sane_lists',      # Better list handling
        ],
        extension_configs={
            'codehilite': {
                'css_class': 'highlight',
                'linenums': False
            }
        }
    )
    
    blog_html = md.convert(enhanced_markdown)
    
    # Build complete HTML document
    html_content = "<!DOCTYPE html>\n<html>\n<head>\n"
    html_content += '<meta charset="UTF-8">\n'
    html_content += '<title>FactFlow AI - Blog Post</title>\n'
    html_content += '</head>\n<body>\n'
    
    # Add metadata section if provided
    if run_config and run_id and created_at:
        html_content += generate_metadata_html(run_config, run_id, created_at)
    
    # Add blog content
    html_content += blog_html
    
    # Add citations section if provided
    if citations:
        html_content += generate_citations_html(citations)
    
    html_content += "\n</body>\n</html>"
    
    # Generate PDF with WeasyPrint
    font_config = FontConfiguration()
    html_doc = HTML(string=html_content)
    css = CSS(string=PDF_CSS, font_config=font_config)
    
    # If output_path provided, write to file and return bytes
    if output_path:
        html_doc.write_pdf(
            output_path,
            stylesheets=[css],
            font_config=font_config
        )
        with open(output_path, 'rb') as f:
            return f.read()
    else:
        # Return bytes directly
        return html_doc.write_pdf(
            stylesheets=[css],
            font_config=font_config
        )
