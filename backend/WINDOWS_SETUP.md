# Windows Setup Guide for PDF Export

## Issue: WeasyPrint requires GTK+ libraries on Windows

WeasyPrint depends on GTK+ libraries (Pango, Cairo, GObject) which aren't included by default on Windows.

## Solutions

### Option 1: Install GTK for Windows (Recommended for Full Features)

**Method A: Using MSYS2 (Easiest)**

1. Download and install [MSYS2](https://www.msys2.org/)

2. Open MSYS2 MINGW64 terminal and run:
```bash
pacman -S mingw-w64-x86_64-gtk3 mingw-w64-x86_64-cairo mingw-w64-x86_64-pango
```

3. Add MSYS2 binaries to your PATH:
   - Default location: `C:\msys64\mingw64\bin`
   - Add to System Environment Variables

4. Restart your terminal and try running the backend:
```bash
uvicorn app.main:app --reload
```

**Method B: Download GTK Binaries**

1. Download GTK3 runtime from [gtk.org](https://www.gtk.org/docs/installations/windows/)
2. Extract to `C:\GTK`
3. Add `C:\GTK\bin` to your PATH
4. Restart terminal

### Option 2: Use Windows Subsystem for Linux (WSL)

```bash
# Install WSL2
wsl --install

# Inside WSL, install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf2.0-0 libffi-dev libcairo2

# Run your backend in WSL
cd /mnt/e/WebDev/Next/Shinrai/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0
```

### Option 3: Disable PDF Export (Quick Start)

If you just want to test the app without PDF export:

1. Comment out WeasyPrint in `requirements.txt`:
```txt
# markdown==3.6
# weasyprint==62.3
# pygments==2.18.0
```

2. The backend will now start, but PDF export will return HTTP 503 error

3. You can still use Markdown and JSON downloads

### Option 4: Use Docker (Production-Ready)

Create `Dockerfile` in backend directory:

```dockerfile
FROM python:3.11-slim

# Install GTK dependencies
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Run with:
```bash
docker build -t factflow-backend .
docker run -p 8000:8000 -v %cd%/data:/app/data factflow-backend
```

## Verification

After installing GTK, test WeasyPrint:

```python
python -c "from weasyprint import HTML; print('✅ WeasyPrint works!')"
```

If successful, start the backend:
```bash
uvicorn app.main:app --reload
```

## Troubleshooting

### Error: "cannot load library 'libgobject-2.0-0'"
- GTK not in PATH
- Solution: Add GTK bin directory to PATH and restart terminal

### Error: "DLL load failed while importing _imaging"
- PIL/Pillow issue
- Solution: `pip install --upgrade Pillow`

### Still not working?
- Try running in WSL or Docker
- Or use Option 3 (disable PDF export temporarily)

## Alternative: Simpler PDF Library (Future)

For Windows compatibility, consider switching to:
- **reportlab** - Pure Python, no external dependencies
- **xhtml2pdf** - HTML to PDF, simpler setup
- **pdfkit** - Uses wkhtmltopdf

We chose WeasyPrint for superior CSS support, but these alternatives work better on Windows out-of-the-box.
