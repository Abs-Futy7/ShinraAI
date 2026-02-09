# PDF Export Feature Documentation

## Overview

The PDF export feature generates professionally styled PDF documents from your blog posts with preserved citations, metadata, and a complete references section.

## Features

### ✨ Styling & Layout
- **Professional Typography** - Clean, readable fonts optimized for print
- **Page Headers & Footers** - Automatic page numbering and document title
- **Metadata Section** - Run ID, generation date, tone, audience, and word count
- **Citations Styling** - Superscript citation markers `[S#]` in blue
- **References Section** - Complete bibliography at the end
- **Syntax Highlighting** - Code blocks with proper formatting
- **Responsive Tables** - Properly styled table layouts
- **Smart Pagination** - Prevents widows, orphans, and awkward page breaks

### 📊 Content Sections

1. **Metadata Header**
   - Run ID for tracking
   - Generation timestamp
   - Tone setting (professional, friendly, etc.)
   - Target audience
   - Word count target

2. **Blog Content**
   - Full markdown content converted to styled HTML
   - Preserved heading hierarchy (H1-H6)
   - Enhanced code blocks with syntax highlighting
   - Styled blockquotes and lists
   - Inline citations as superscript

3. **References Section**
   - All cited sources listed
   - Source ID, title, and URL
   - Internal sources marked appropriately

## Usage

### Backend API

**Endpoint:** `GET /runs/{run_id}/export/pdf`

**Requirements:**
- Run must be in `DONE` or `DONE_WITH_WARNINGS` status
- Final blog content must be available

**Response:**
- Content-Type: `application/pdf`
- Filename: `blog-post-{run_id[:8]}.pdf`

**Example:**
```bash
curl -O http://localhost:8000/runs/550e8400-e29b-41d4-a716-446655440000/export/pdf
```

### Frontend Integration

**Download via UI:**
Click the "📄 Download PDF" button on the run timeline page.

**Programmatic Download:**
```typescript
import { downloadPdf, triggerPdfDownload } from "@/lib/api";

const handleDownload = async (runId: string) => {
  try {
    const blob = await downloadPdf(runId);
    triggerPdfDownload(runId, blob);
  } catch (error) {
    console.error("PDF download failed:", error);
  }
};
```

## Technical Implementation

### Dependencies

```python
markdown==3.6         # Convert Markdown to HTML
weasyprint==62.3      # Generate PDFs from HTML/CSS
pygments==2.18.0      # Syntax highlighting for code blocks
```

### Architecture

```
Markdown Blog Post
    ↓
[enhance_citations_in_markdown]
    ↓
Enhanced Markdown with <sup> tags
    ↓
[markdown.Markdown converter]
    ↓
HTML Content
    ↓
[generate_metadata_html + generate_citations_html]
    ↓
Complete HTML Document
    ↓
[WeasyPrint + PDF_CSS]
    ↓
PDF Bytes
```

### Key Functions

**`generate_pdf_from_run_state(run_state: dict, output_path: str = None) -> bytes`**
- Main entry point for PDF generation
- Extracts blog content and metadata from run state
- Returns PDF as bytes (optionally writes to file)

**`enhance_citations_in_markdown(markdown_text: str) -> str`**
- Converts `[S#]` to `<sup class="citation">[S#]</sup>`
- Preserves citation format while adding styling

**`generate_metadata_html(run_config: dict, run_id: str, created_at: str) -> str`**
- Creates formatted metadata header section
- Includes run details and configuration

**`generate_citations_html(citations: list) -> str`**
- Builds references section from citation objects
- Formats as styled bibliography

## Styling Customization

The PDF appearance is controlled by `PDF_CSS` in `backend/app/utils/pdf_generator.py`.

### Key Style Variables

```css
/* Page Layout */
@page {
    size: A4;
    margin: 2.5cm 2cm;
}

/* Typography */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11pt;
    line-height: 1.6;
}

/* Citations */
sup.citation {
    color: #2563eb;      /* Blue */
    font-weight: 600;
    font-size: 9pt;
}
```

### Customization Examples

**Change Page Size:**
```css
@page {
    size: Letter;  /* or Legal, A3, etc. */
    margin: 1in;
}
```

**Adjust Fonts:**
```css
body {
    font-family: Georgia, serif;
    font-size: 12pt;
}
```

**Modify Citation Style:**
```css
sup.citation {
    color: #dc2626;      /* Red */
    background: #fef2f2; /* Light red background */
    padding: 0 0.2em;
    border-radius: 2px;
}
```

## Error Handling

### Common Issues

**1. No blog content found**
```json
{
  "status": 400,
  "detail": "No blog content found in run state"
}
```
**Solution:** Ensure the pipeline has completed successfully

**2. Run not complete**
```json
{
  "status": 400,
  "detail": "Cannot export PDF. Run status: RUNNING. Pipeline must be complete."
}
```
**Solution:** Wait for the run to finish (status = DONE or DONE_WITH_WARNINGS)

**3. WeasyPrint errors**
- **Missing fonts:** WeasyPrint will fall back to system fonts
- **Invalid HTML:** Check console logs for parsing errors
- **Memory issues:** Large documents may require more RAM

## Testing

### Manual Test

```bash
cd backend
python test_pdf.py
```

This generates `test_output.pdf` with sample content to verify:
- Metadata rendering
- Citation styling
- References section
- Page numbering
- Typography

### Integration Test

```python
from app.utils.pdf_generator import generate_pdf_from_run_state

run_state = {
    "run_id": "test-123",
    "created_at": "2026-02-09T10:30:00Z",
    "config": {
        "tone": "professional",
        "audience": "engineers",
        "word_count": 1000
    },
    "steps": {
        "final": {
            "markdown": "# Test Blog\n\nContent with citation [S0]."
        }
    },
    "citations": [
        {"id": "S0", "title": "Source", "url": "https://example.com"}
    ]
}

pdf_bytes = generate_pdf_from_run_state(run_state)
assert len(pdf_bytes) > 0
```

## Performance

**Typical Generation Times:**
- 500-word blog: ~2-3 seconds
- 1500-word blog: ~4-5 seconds
- 3000-word blog: ~6-8 seconds

**Optimization Tips:**
- PDF generation is CPU-bound (not parallelizable)
- Consider caching generated PDFs
- For high-traffic scenarios, use a job queue (Celery/RQ)

## Roadmap

### Planned Enhancements

- [ ] **Custom Templates** - User-selectable PDF themes
- [ ] **Watermarks** - Add branding or draft markers
- [ ] **Table of Contents** - Auto-generated TOC with page numbers
- [ ] **Images** - Embed charts/diagrams from PRD
- [ ] **Export Presets** - One-click export for different formats (A4 print, Letter, screen-optimized)
- [ ] **Batch Export** - Generate PDFs for multiple runs simultaneously

## Support

**Issues?** Check:
1. WeasyPrint installation: `pip show weasyprint`
2. Required dependencies: `pip install -r requirements.txt`
3. Backend logs: Check `/runs/{id}` logs endpoint
4. Browser console: Look for download errors

**Need Help?** Open an issue in the GitHub repository with:
- Run ID that failed
- Error message from API response
- Browser console logs (for frontend issues)
- System info (OS, Python version)
