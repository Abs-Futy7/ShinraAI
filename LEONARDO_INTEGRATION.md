# Leonardo AI Image Generation Integration

This document explains how the Leonardo AI integration works in Shinrai.

## Setup

### 1. Get Your API Key

1. Sign up or log in to [leonardo.ai](https://leonardo.ai)
2. Go to Settings → API Access and generate an API key
3. Add to `backend/.env`:

```env
LEONARDO_API_KEY=your_api_key_here
```

### 2. Install Dependencies

```bash
pip install httpx  # Already included in requirements
```

**Implementation**: We use Leonardo AI's official REST API directly with `httpx`, not a third-party wrapper. This ensures reliability and supports the latest features.

## How It Works

### Backend Flow

1. **LinkedIn Pack Generation** (`/runs/{run_id}/linkedin-pack`)
   - Creates image prompt using Image Prompt Agent
   - Stores prompt in `linkedin_pack.image_prompt`

2. **Image Generation** (`/runs/{run_id}/generate-image`)
   - Uses the stored image prompt
   - Calls Leonardo AI API via `LeonardoService`
   - Stores result in `linkedin_pack.generated_image`

### Leonardo Service (`app/services/leonardo_service.py`)

```python
leonardo = LeonardoService()

result = await leonardo.generate_image(
    prompt="Your main prompt",
    negative_prompt="Things to avoid",
    width=1024,
    height=768,
    guidance_scale=7
)
# Returns: {generation_id, images: [url1, url2, ...], status}
```

### Frontend Flow

1. User generates LinkedIn Pack (3 agents run)
2. Image prompt is displayed with details
3. User clicks "🎨 Generate Image with Leonardo AI"
4. API call to `/generate-image`
5. Image URL returned and displayed

## Models

Default model: **Leonardo Kino XL** (photorealistic)

Available models in `leonardo_service.py`:
- `kino_xl`: Leonardo Kino XL (photorealistic)
- `vision_xl`: Leonardo Vision XL
- `anime_xl`: Leonardo Anime XL
- `diffusion_xl`: Leonardo Diffusion XL

To change model, modify the `model_id` parameter in `main.py`.

## API Limits

Leonardo has API rate limits. Our implementation handles:
- Async generation (non-blocking with httpx)
- Automatic polling for completion (up to 60 seconds)
- Proper error handling and timeouts
- Direct REST API calls for maximum reliability

## Troubleshooting

### "Leonardo API key not found"
- Check `.env` file has `LEONARDO_API_KEY`
- Restart backend: `uvicorn app.main:app --reload`

### API Errors (401 Unauthorized)
- Verify your API key at [leonardo.ai](https://leonardo.ai) → Settings → API
- Ensure key is active and has permissions
- Check account has sufficient credits

### Generation Timeouts
- Default: 60 seconds (30 polls × 2 sec intervals)
- Check Leonardo dashboard for queue status
- Try reducing dimensions or num_images

### Images not displaying
- Check browser console for CORS errors
- Leonardo URLs may expire - regenerate if needed
- Verify generation completed in Leonardo dashboard

## Cost Considerations

- Leonardo uses token-based system
- Each generation consumes tokens
- Monitor usage in Leonardo dashboard
- Consider implementing usage limits in production

## Future Enhancements

- [ ] Model selection in frontend
- [ ] Multiple image generation
- [ ] Image editing/variations
- [ ] Download generated images
- [ ] Gallery view for multiple images
