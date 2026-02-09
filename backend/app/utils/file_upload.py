"""
File upload handling and text extraction utilities.
"""
from pypdf import PdfReader
from pathlib import Path
from typing import Optional
import tempfile
import os
import platform

# Try to import OCR libraries (multiple options for flexibility)
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Option 1: EasyOCR (pure Python, no external dependencies, recommended)
try:
    import easyocr
    EASYOCR_AVAILABLE = True
    # Initialize reader lazily to avoid slow startup
    _easyocr_reader = None
except ImportError:
    EASYOCR_AVAILABLE = False

# Option 2: Pytesseract (requires Tesseract binary installation)
try:
    import pytesseract
    
    # Auto-detect tesseract path based on platform
    if platform.system() == 'Windows':
        possible_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
        ]
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break
    
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text content
        
    Raises:
        Exception: If PDF reading fails
    """
    try:
        reader = PdfReader(file_path)
        text = "\n\n".join(page.extract_text() for page in reader.pages if page.extract_text())
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")


def extract_text_from_txt(file_path: str) -> str:
    """
    Read text content from a plain text file.
    
    Args:
        file_path: Path to the text file
        
    Returns:
        Text content
        
    Raises:
        Exception: If file reading fails
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except UnicodeDecodeError:
        # Try with latin-1 encoding as fallback
        with open(file_path, 'r', encoding='latin-1') as f:
            return f.read().strip()
    except Exception as e:
        raise Exception(f"Failed to read text file: {str(e)}")


def extract_text_from_markdown(file_path: str) -> str:
    """
    Read text content from a Markdown file.
    
    Args:
        file_path: Path to the Markdown file
        
    Returns:
        Markdown content
        
    Raises:
        Exception: If file reading fails
    """
    # Markdown files are just text files, use same extraction
    return extract_text_from_txt(file_path)


def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from an image file using OCR.
    
    Tries multiple OCR engines in order:
    1. EasyOCR (no external dependencies required - recommended)
    2. Pytesseract (requires Tesseract binary installation)
    
    Args:
        file_path: Path to the image file
        
    Returns:
        Extracted text content
        
    Raises:
        ImportError: If no OCR library is available
        Exception: If OCR extraction fails
    """
    if not PIL_AVAILABLE:
        raise ImportError(
            "Pillow is required for image processing. "
            "Install it with: pip install Pillow"
        )
    
    # Method 1: Try EasyOCR first (no external dependencies)
    if EASYOCR_AVAILABLE:
        try:
            global _easyocr_reader
            
            # Initialize reader on first use (lazy loading to avoid slow startup)
            if _easyocr_reader is None:
                _easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            
            # Extract text
            result = _easyocr_reader.readtext(file_path, detail=0)
            text = ' '.join(result)
            
            # Clean the extracted text
            clean_text = text.replace("\x0c", "").strip()
            
            return clean_text
            
        except Exception as e:
            # If EasyOCR fails, try Tesseract as fallback
            if not TESSERACT_AVAILABLE:
                raise Exception(f"EasyOCR failed: {str(e)}")
    
    # Method 2: Try Pytesseract (requires Tesseract binary)
    if TESSERACT_AVAILABLE:
        try:
            # Open the image
            image = Image.open(file_path)
            
            # Convert to grayscale for better OCR accuracy
            gray_image = image.convert("L")
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(gray_image)
            
            # Clean the extracted text
            clean_text = text.replace("\x0c", "").strip()
            
            return clean_text
            
        except Exception as e:
            raise Exception(f"Pytesseract failed: {str(e)}")
    
    # No OCR engine available
    raise ImportError(
        "No OCR engine available. Install one of:\n"
        "  - EasyOCR (recommended, no external dependencies): pip install easyocr\n"
        "  - Pytesseract (requires Tesseract binary): pip install pytesseract\n"
        "     Then download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki"
    )


def extract_text_from_file(file_path: str, filename: str) -> str:
    """
    Extract text from a file based on its extension.
    
    Supported formats:
    - .pdf (via pypdf)
    - .txt (plain text)
    - .md (markdown)
    - .png, .jpg, .jpeg, .bmp, .tiff (via OCR using pytesseract)
    
    Args:
        file_path: Path to the file
        filename: Original filename (used to determine type)
        
    Returns:
        Extracted text content
        
    Raises:
        ValueError: If file type is not supported
        Exception: If extraction fails
    """
    file_ext = Path(filename).suffix.lower()
    
    if file_ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_ext == '.txt':
        return extract_text_from_txt(file_path)
    elif file_ext in ['.md', '.markdown']:
        return extract_text_from_markdown(file_path)
    elif file_ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif']:
        return extract_text_from_image(file_path)
    else:
        raise ValueError(
            f"Unsupported file type: {file_ext}. "
            f"Supported formats: .pdf, .txt, .md, .png, .jpg, .jpeg, .bmp, .tiff"
        )


def validate_file_size(file_size: int, max_size_mb: int = 10) -> None:
    """
    Validate that file size is within allowed limits.
    
    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in megabytes
        
    Raises:
        ValueError: If file is too large
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise ValueError(
            f"File size ({file_size / 1024 / 1024:.2f} MB) exceeds "
            f"maximum allowed size ({max_size_mb} MB)"
        )


def validate_file_extension(filename: str, allowed_extensions: list = None) -> None:
    """
    Validate that file has an allowed extension.
    
    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (e.g., ['.pdf', '.txt'])
        
    Raises:
        ValueError: If file extension is not allowed
    """
    if allowed_extensions is None:
        allowed_extensions = ['.pdf', '.txt', '.md', '.markdown', '.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif']
    
    file_ext = Path(filename).suffix.lower()
    if file_ext not in allowed_extensions:
        raise ValueError(
            f"File type '{file_ext}' is not allowed. "
            f"Allowed types: {', '.join(allowed_extensions)}"
        )
