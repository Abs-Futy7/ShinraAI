# Model Configuration Guide

## Quick Start - Choose Your Model

You have two options: **Groq** (fast, no web search) or **Gemini** (supports web search).

### Option 1: Gemini (Recommended) ✅

**✓ Pros:**
- Supports web search via SerperDevTool
- Free tier available (gemini-2.0-flash-exp)
- Function calling support
- Better for research-heavy tasks

**Configuration:**
```env
# In backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
MODEL=gemini/gemini-2.0-flash-exp
SERPER_API_KEY=your_serper_key_here
```

**Get API Keys:**
- Gemini: https://ai.google.dev/gemini-api/docs/api-key
- Serper: https://serper.dev/ (free tier available)

### Option 2: Groq (Fast Alternative)

**✓ Pros:**
- Very fast inference
- Free tier available
- Lower latency

**✗ Cons:**
- No web search support (no function calling)
- Research limited to PRD content only

**Configuration:**
```env
# In backend/.env
GROQ_API_KEY=your_groq_api_key_here
MODEL=groq/llama-3.1-8b-instant
```

**Get API Key:**
- Groq: https://console.groq.com/keys

---

## Available Models

### Gemini Models (Supports Web Search)

| Model | Free Tier | Speed | Quality | Tokens |
|-------|-----------|-------|---------|--------|
| `gemini/gemini-2.0-flash-exp` | ✅ Yes | Fast | Good | Limited |
| `gemini/gemini-1.5-flash` | ✅ Yes | Fast | Good | Limited |
| `gemini/gemini-1.5-pro` | ❌ Paid | Medium | Better | More |

### Groq Models (No Web Search)

| Model | Free Tier | Speed | Quality | Tokens |
|-------|-----------|-------|---------|--------|
| `groq/llama-3.1-8b-instant` | ✅ Yes | Very Fast | Good | Limited |
| `groq/llama-3.3-70b-versatile` | ✅ Yes | Fast | Better | Limited |

---

## Free Tier Optimization

The system is configured for **minimal token usage** on free tiers:

### Automatic Optimizations:
- **Max output tokens**: Limited to 2048 for Gemini
- **Temperature**: Optimized for efficiency
- **Top-K**: Set to 40 for Gemini
- **Top-P**: Set to 0.9 for Gemini

### Tips to Save Tokens:
1. **Keep PRDs concise** - Shorter input = fewer tokens
2. **Use lower word counts** - Set target to 500-800 words
3. **Disable web search** if not needed
4. **Use Groq for simple tasks** (faster, no web search overhead)
5. **Use Gemini for research tasks** (when web search is essential)

---

## Web Search Configuration

### Enable Web Search:

1. **Set MODEL to Gemini**:
   ```env
   MODEL=gemini/gemini-2.0-flash-exp
   ```

2. **Add Serper API Key**:
   ```env
   SERPER_API_KEY=your_key_here
   ```

3. **Check the box** in the frontend UI

### SerperDevTool Parameters:

The tool is configured with defaults, but you can customize in `backend/app/tools/search_tool.py`:

```python
from crewai_tools import SerperDevTool

tool = SerperDevTool(
    search_url="https://google.serper.dev/search",  # Default search
    # search_url="https://google.serper.dev/scholar",  # Academic papers
    n_results=10,  # Number of results (default)
    country="us",  # Optional: specific country
    locale="en",   # Optional: language
)
```

**Other Search URLs:**
- `https://google.serper.dev/search` - General search (default)
- `https://google.serper.dev/scholar` - Academic papers
- `https://google.serper.dev/news` - News articles
- `https://google.serper.dev/images` - Image search

---

## Current Configuration Check

### Backend Logs:
When you start a run, check the logs for:
- ✓ "Web search enabled (SerperDevTool with Gemini)" - Working correctly
- ⚠ "Web search disabled: Only supported with Gemini models" - Using Groq
- ⚠ "SerperDevTool unavailable" - Check SERPER_API_KEY

### Frontend:
- Blue checkmark: Gemini models supported
- Amber X: Groq models not supported

---

## Troubleshooting

### "Web search disabled: Only supported with Gemini models"
**Solution:** Change MODEL to a Gemini model in `.env`

### "SerperDevTool unavailable"
**Solution:** Add SERPER_API_KEY to `.env`

### "Rate limit exceeded"
**Solution:** 
- Wait a few minutes
- Switch to different model
- Use smaller word counts
- Disable web search

### Slow performance
**Solution:**
- Use `groq/llama-3.1-8b-instant` for speed
- Reduce word count target
- Disable web search if not needed

---

## Migration from Old Config

If you have old `.env` with `GROQ_MODEL`:

**Before:**
```env
GROQ_MODEL=groq/llama-3.1-8b-instant
```

**After:**
```env
MODEL=groq/llama-3.1-8b-instant
# OR
MODEL=gemini/gemini-2.0-flash-exp
```

Both `MODEL` and `GROQ_MODEL` are supported for backward compatibility.

---

## Summary

| Feature | Groq | Gemini |
|---------|------|--------|
| Web Search | ❌ | ✅ |
| Speed | Very Fast | Fast |
| Free Tier | ✅ | ✅ |
| Function Calling | ❌ | ✅ |
| Best For | Simple tasks | Research tasks |

**Recommendation:** Use **Gemini** (`gemini/gemini-2.0-flash-exp`) for best results with web search support.
