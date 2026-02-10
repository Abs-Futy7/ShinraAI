"""
Quick test script for Leonardo AI integration.
Run this to verify your Leonardo API key/cookie works before testing in the app.

Usage:
    python test_leonardo.py
"""

import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.leonardo_service import LeonardoService


async def test_leonardo():
    """Test Leonardo AI image generation."""
    
    print("🎨 Testing Leonardo AI Integration\n")
    
    # Test 1: Service Initialization
    print("1️⃣ Initializing Leonardo Service...")
    try:
        service = LeonardoService()
        print("   ✅ Service initialized successfully")
        print(f"   📝 Using model: {service.DEFAULT_MODEL}")
    except Exception as e:
        print(f"   ❌ Failed to initialize: {e}")
        print("\n💡 Tips:")
        print("   - Check if LEONARDO_API_KEY or LEONARDO_COOKIE is set in .env")
        print("   - Try using LEONARDO_COOKIE if API key doesn't work")
        return
    
    # Test 2: Simple Image Generation
    print("\n2️⃣ Generating test image...")
    print("   Prompt: 'A futuristic AI robot in a modern office'")
    
    try:
        result = await service.generate_image(
            prompt="A futuristic AI robot in a modern office, professional lighting, high quality",
            negative_prompt="blurry, low quality, distorted",
            width=512,
            height=512
        )
        
        print("   ✅ Generation successful!")
        print(f"   🆔 Generation ID: {result['generation_id']}")
        print(f"   📊 Status: {result['status']}")
        print(f"   🖼️  Images generated: {len(result.get('images', []))}")
        
        if result.get('images'):
            print("\n   🔗 Image URLs:")
            for i, url in enumerate(result['images'], 1):
                print(f"      {i}. {url}")
            print("\n   💡 Open these URLs in your browser to view the images")
        
    except Exception as e:
        print(f"   ❌ Leonardo API error: {e}")
        print("\n💡 Troubleshooting:")
        print("   - Verify your Leonardo account has credits")
        print("   - Check if your API key is valid and active")
        print("   - Check rate limits on your account")
        return
    
    print("\n✨ Leonardo AI integration is working correctly!")
    print("   You can now use the 'Generate Image' feature in the app")


if __name__ == "__main__":
    asyncio.run(test_leonardo())
