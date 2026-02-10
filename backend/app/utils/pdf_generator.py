"""
PDF generation utility for blog posts using Aspose.HTML.
"""
import os
import tempfile
import markdown
from markdown.extensions.codehilite import CodeHiliteExtension
from markdown.extensions.tables import TableExtension
from markdown.extensions.fenced_code import FencedCodeExtension
import aspose.html as html
import aspose.html.converters as converters
import aspose.html.saving as saving
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


def enhance_citations_in_html(html_text: str) -> str:
    """
    Convert [S#] citation format to styled span for PDF.
    Applied AFTER markdown to HTML conversion to avoid escaping.
    
    Example: [S1] -> <span class="citation-ref">[S1]</span>
    """
    # Replace [S#] with styled span
    enhanced = re.sub(
        r'\[S(\d+)\]',
        r'<span class="citation-ref">[S\1]</span>',
        html_text
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
    Convert markdown blog post to beautifully styled PDF using Aspose.HTML.
    
    Args:
        markdown_text: Blog post in Markdown format with [S#] citations
        output_path: Output file path for PDF
        citations: List of citation objects with id, title, url
        run_config: Run configuration metadata
        run_id: Unique run identifier
        created_at: Timestamp of run creation
    """
    # Convert markdown to HTML first (keep citations as [S#] for now)
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
    
    blog_html = md.convert(markdown_text)
    
    # NOW enhance citations in the HTML (after markdown conversion)
    blog_html = enhance_citations_in_html(blog_html)
    
    # Build complete styled HTML document
    html_content = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FactFlow AI - Blog Post</title>
    <style>
        @page {
            size: A4;
            margin: 2.5cm 2cm;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.7;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }
        
        /* Header with metadata */
        .metadata-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .metadata-header h1 {
            margin: 0 0 1rem 0;
            font-size: 24pt;
            font-weight: 700;
            color: white;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-top: 1rem;
            font-size: 9pt;
            opacity: 0.95;
        }
        
        .metadata-item {
            display: flex;
            gap: 0.5rem;
        }
        
        .metadata-label {
            font-weight: 600;
            opacity: 0.9;
        }
        
        /* Main content */
        h1 {
            font-size: 28pt;
            font-weight: 700;
            color: #111827;
            margin: 2rem 0 1.5rem 0;
            line-height: 1.2;
            border-bottom: 3px solid #667eea;
            padding-bottom: 0.5rem;
        }
        
        h2 {
            font-size: 20pt;
            font-weight: 600;
            color: #1f2937;
            margin: 2rem 0 1rem 0;
            line-height: 1.3;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.4rem;
        }
        
        h3 {
            font-size: 16pt;
            font-weight: 600;
            color: #374151;
            margin: 1.5rem 0 0.75rem 0;
        }
        
        h4, h5, h6 {
            font-size: 13pt;
            font-weight: 600;
            color: #4b5563;
            margin: 1rem 0 0.5rem 0;
        }
        
        p {
            margin-bottom: 1.2rem;
            text-align: justify;
            color: #374151;
        }
        
        /* Lists */
        ul, ol {
            margin-bottom: 1.2rem;
            padding-left: 2rem;
        }
        
        li {
            margin-bottom: 0.6rem;
            color: #374151;
        }
        
        /* Citations */
        .citation-ref {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
            margin: 0 2px;
            text-decoration: none;
        }
        
        /* Code blocks */
        pre {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #667eea;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 9pt;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            color: #e91e63;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: #1f2937;
        }
        
        /* Blockquotes */
        blockquote {
            border-left: 4px solid #667eea;
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: #6b7280;
            font-style: italic;
            background: #f9fafb;
            padding: 1rem 1rem 1rem 1.5rem;
            border-radius: 0 6px 6px 0;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 0.75rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        tr:nth-child(even) {
            background: #f9fafb;
        }
        
        /* Links */
        a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        /* References section */
        .references-section {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 3px solid #e5e7eb;
        }
        
        .references-section h2 {
            color: #667eea;
            font-size: 22pt;
            margin-bottom: 1.5rem;
        }
        
        .citation-item {
            margin-bottom: 1.2rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .citation-id {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            margin-right: 0.5rem;
            font-size: 9pt;
        }
        
        .citation-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 10pt;
        }
        
        .citation-url {
            color: #6b7280;
            font-size: 9pt;
            word-break: break-all;
            margin-top: 0.25rem;
            display: block;
        }
        
        /* Footer */
        .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 9pt;
        }
    </style>
</head>
<body>
"""
    
    # Add metadata header if provided
    if run_config and run_id and created_at:
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            formatted_date = created_date.strftime('%B %d, %Y at %I:%M %p')
        except:
            formatted_date = created_at
        
        html_content += f"""
    <div class="metadata-header">
        <h1>{run_config.get('topic', 'Blog Post')}</h1>
        <div style="font-size: 10pt; opacity: 0.9;">Generated by FactFlow AI</div>
        <div class="metadata-grid">
            <div class="metadata-item">
                <span class="metadata-label">📅 Date:</span>
                <span>{formatted_date}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">🎯 Tone:</span>
                <span>{run_config.get('tone', 'N/A')}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">👥 Audience:</span>
                <span>{run_config.get('audience', 'N/A')}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">📝 Target Words:</span>
                <span>{run_config.get('word_count', 'N/A')}</span>
            </div>
        </div>
    </div>
"""
    
    # Add blog content
    html_content += blog_html
    
    # Add citations section if provided
    if citations:
        html_content += '<div class="references-section"><h2>📚 References</h2>'
        for citation in citations:
            citation_id = citation.get('id', 'N/A')
            title = citation.get('title', 'Untitled')
            url = citation.get('url', 'N/A')
            
            if url == 'internal' or url == 'N/A':
                url_display = '<span class="citation-url">(Internal source)</span>'
            else:
                url_display = f'<span class="citation-url">{url}</span>'
            
            html_content += f"""
        <div class="citation-item">
            <span class="citation-id">{citation_id}</span>
            <span class="citation-title">{title}</span>
            {url_display}
        </div>
"""
        html_content += '</div>'
    
    # Add footer
    html_content += """
    <div class="footer">
        Generated with FactFlow AI • Powered by CrewAI & Groq
    </div>
</body>
</html>
"""
    
    # Create temporary HTML file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_html:
        temp_html.write(html_content)
        temp_html_path = temp_html.name
    
    try:
        # Load HTML document
        document = html.HTMLDocument(temp_html_path)
        
        # Create PDF save options
        pdf_options = saving.PdfSaveOptions()
        pdf_options.jpeg_quality = 95
        
        # Convert HTML to PDF
        converters.Converter.convert_html(document, pdf_options, output_path)
    finally:
        # Clean up temporary file
        if os.path.exists(temp_html_path):
            os.remove(temp_html_path)


def generate_pdf_from_run_state(run_state: dict, output_path: str = None) -> bytes:
    """
    Generate PDF from complete run state object using Aspose.HTML.
    
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
    
    # Generate PDF to temp file if no output_path provided
    if not output_path:
        temp_pdf = tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf', delete=False)
        output_path = temp_pdf.name
        temp_pdf.close()
        cleanup_temp = True
    else:
        cleanup_temp = False
    
    try:
        # Use markdown_to_pdf to generate the PDF
        markdown_to_pdf(
            markdown_text=final_blog,
            output_path=output_path,
            citations=citations,
            run_config=run_config,
            run_id=run_id,
            created_at=created_at
        )
        
        # Read and return the PDF bytes
        with open(output_path, 'rb') as f:
            pdf_bytes = f.read()
        
        return pdf_bytes
    finally:
        # Clean up temp file if we created one
        if cleanup_temp and os.path.exists(output_path):
            os.remove(output_path)
