# File Upload Feature

## Overview
The file upload feature allows users to upload PRD files (PDF, TXT, or Markdown) instead of manually pasting text. The system extracts text content from uploaded files and automatically populates the PRD input field.

## Supported File Types
- **PDF** (.pdf) - Extracts text using pypdf library
- **Text** (.txt) - Handles UTF-8 and Latin-1 encoding
- **Markdown** (.md, .markdown) - Treats as plain text

## File Size Limit
- Maximum file size: **10MB**
- Files exceeding this limit will be rejected with an error message

## How to Use

### Frontend (User Experience)
1. Navigate to the home page
2. Look for the **"📤 Upload PRD File"** section (green gradient box)
3. Click the section to expand the upload interface
4. Choose one of two methods:
   - **Drag & Drop**: Drag a file from your file explorer and drop it into the upload zone
   - **Click to Browse**: Click anywhere in the upload zone to open a file picker dialog
5. Once uploaded successfully:
   - The extracted text appears in the PRD textarea below
   - A green checkmark shows the filename: "✓ Loaded from: filename.pdf"
   - The upload section auto-collapses
   - The page scrolls to the PRD textarea for easy editing

### API Endpoint

#### POST /upload
Upload a file and extract its text content.

**Request**:
```http
POST /upload
Content-Type: multipart/form-data

file: [binary file data]
```

**Response** (Success - 200):
```json
{
  "success": true,
  "filename": "example.pdf",
  "text": "Extracted text content here...",
  "length": 1234
}
```

**Response** (Invalid File - 400):
```json
{
  "detail": "Invalid file type. Only .pdf, .txt, .md, .markdown files are allowed"
}
```

**Response** (File Too Large - 400):
```json
{
  "detail": "File size (11534336 bytes) exceeds maximum allowed size (10485760 bytes)"
}
```

**Response** (Processing Error - 500):
```json
{
  "detail": "Failed to process file: [error details]"
}
```

## Technical Implementation

### Backend Components

#### 1. File Upload Utilities (`backend/app/utils/file_upload.py`)
```python
# Main extraction function
extract_text_from_file(file_path: str) -> str

# Format-specific extractors
extract_text_from_pdf(file_path: str) -> str
extract_text_from_txt(file_path: str) -> str
extract_text_from_markdown(file_path: str) -> str

# Validation functions
validate_file_size(file_content: bytes, max_size: int = 10_485_760) -> None
validate_file_extension(filename: str) -> None
```

#### 2. API Endpoint (`backend/app/main.py`)
```python
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. Validate file extension
    # 2. Read file content
    # 3. Validate file size
    # 4. Save to temporary file
    # 5. Extract text using appropriate utility
    # 6. Clean up temporary file
    # 7. Return extracted text
```

### Frontend Components

#### 1. FileUpload Component (`frontend/components/FileUpload.tsx`)
Features:
- Drag-and-drop interface with visual feedback
- Click-to-browse file picker
- Real-time upload progress indicator
- Error handling with user-friendly messages
- Client-side validation (file type, size)
- Server-side validation confirmation
- Responsive design with Tailwind CSS

#### 2. Page Integration (`frontend/app/page.tsx`)
State Management:
```typescript
const [showUpload, setShowUpload] = useState(true);  // Toggle upload section
const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);  // Track uploaded file

const handleFileUpload = (text: string, filename: string) => {
  setPrd(text);  // Populate PRD textarea
  setUploadedFilename(filename);  // Show filename indicator
  setShowUpload(false);  // Auto-collapse upload section
  // Auto-scroll to textarea
};
```

## User Experience Flow

### Successful Upload Flow
```
1. User clicks "Upload PRD File" section
2. Upload interface appears with drag-drop zone
3. User drops/selects a file
4. Frontend validates file type and size
5. "Uploading..." indicator appears
6. File sent to backend API
7. Backend validates and extracts text
8. Frontend receives extracted text
9. Text populates PRD textarea
10. Green checkmark shows filename
11. Upload section auto-collapses
12. Page scrolls to textarea
```

### Error Handling Flow
```
1. User selects invalid file
2. Frontend/backend detects issue:
   - Wrong file type
   - File too large
   - Extraction failure
3. Red error message appears:
   "⚠️ [Specific error message]"
4. User can try again with different file
5. File input resets automatically
```

## Input Method Priority
Users can choose between three input methods (in any order):
1. **Template Library** - Pre-built examples (📚 blue section)
2. **File Upload** - Upload existing documents (📤 green section)
3. **Manual Paste** - Type or paste text directly

When switching between methods:
- Uploaded filename indicator clears if user manually edits text
- Each method auto-collapses its section after use
- All methods populate the same PRD textarea

## Security Considerations

### File Validation
- **Extension whitelist**: Only `.pdf`, `.txt`, `.md`, `.markdown` allowed
- **Size limit**: 10MB prevents DoS attacks
- **No execution**: Files are only read for text extraction
- **Temporary files**: Cleaned up immediately after processing

### Error Messages
- User-friendly messages hide internal details
- Server errors don't expose file paths or system info
- Validation errors provide specific guidance

## Testing

### Manual Testing Steps
1. **Valid PDF Upload**:
   - Upload a PDF with text content
   - Verify text appears in textarea
   - Check filename indicator appears

2. **Invalid File Type**:
   - Try uploading .docx, .xlsx, or .exe
   - Verify error message appears

3. **File Too Large**:
   - Upload file > 10MB
   - Verify size error message

4. **Empty/Corrupt File**:
   - Upload empty or corrupt PDF
   - Verify graceful error handling

5. **Drag & Drop**:
   - Drag file from file explorer
   - Verify upload works same as browse

6. **Multiple Uploads**:
   - Upload file A
   - Upload file B
   - Verify second upload replaces first

### API Testing with cURL
```bash
# Valid upload
curl -X POST http://localhost:8000/upload \
  -F "file=@test.pdf"

# Expected: {"success": true, "filename": "test.pdf", "text": "...", "length": 1234}

# Invalid file type
curl -X POST http://localhost:8000/upload \
  -F "file=@test.docx"

# Expected: 400 error with invalid file type message
```

## Dependencies
- **Backend**: pypdf (installed), tempfile (stdlib), os (stdlib)
- **Frontend**: React useState/useRef hooks, fetch API

## Future Enhancements
- Support for .docx files (requires python-docx)
- Support for .rtf files (requires pyth or striprtf)
- OCR for scanned PDFs (requires pytesseract)
- Progress bar for large file uploads
- Preview extracted text before accepting
- Batch upload multiple files
- Save uploaded files for history/audit

## Troubleshooting

### "Failed to upload file" Error
- Check backend is running on port 8000
- Verify CORS is enabled (allow_origins=["*"])
- Check browser console for network errors
- Verify file meets size/type requirements

### "No text extracted from file" Error
- PDF might be image-based (needs OCR)
- File might be corrupt or password-protected
- Text encoding might not be supported

### PDF Text Extraction Issues
- pypdf works best with text-based PDFs
- Scanned PDFs require OCR (not currently supported)
- Complex formatting may result in garbled text
- Try converting PDF to text first if extraction fails

## Related Documentation
- [PDF Export Feature](./PDF_EXPORT_DOCS.md)
- [Template Library](./TEMPLATE_LIBRARY.md)
- [API Documentation](./API.md)
