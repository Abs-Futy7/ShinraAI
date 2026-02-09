"""
Quick test script to verify PDF generation functionality.
Run: python test_pdf.py
"""
from app.utils.pdf_generator import generate_pdf_from_run_state
from datetime import datetime

# Sample blog post with citations
sample_blog = """# Introducing CloudSync: Real-Time Data Synchronization

CloudSync is a revolutionary data synchronization platform that enables seamless real-time updates across distributed systems [S0]. The platform leverages WebSocket connections to maintain persistent connections with minimal latency [S1].

## Key Features

### Lightning-Fast Performance
CloudSync processes over 10,000 events per second with sub-50ms latency [S2]. This makes it ideal for applications requiring real-time updates such as collaborative editing tools, live dashboards, and financial trading platforms.

### Enterprise-Grade Security
All data transmissions are encrypted using TLS 1.3 [S0]. The platform also supports OAuth 2.0 and SAML authentication [S1], ensuring that only authorized users can access synchronized data.

### Easy Integration
Developers can integrate CloudSync in minutes using our SDKs for Python, JavaScript, Java, and .NET [S0]. The simple API design means minimal code changes to existing applications.

## Use Cases

CloudSync excels in scenarios where multiple clients need to see updates instantly:

- **Collaborative Tools**: Enable real-time document editing with conflict resolution
- **IoT Monitoring**: Track sensor data across distributed devices
- **Gaming**: Synchronize player states in multiplayer environments
- **Financial Systems**: Stream market data to trading terminals

## Getting Started

```python
from cloudsync import Client

client = Client(api_key="your_api_key")
client.connect()

# Subscribe to updates
@client.subscribe("user.123")
def on_update(data):
    print(f"Received: {data}")

# Publish changes
client.publish("user.123", {"status": "online"})
```

## Conclusion

CloudSync transforms how applications handle real-time data synchronization. With enterprise-grade security, lightning-fast performance, and easy integration, it's the ideal choice for modern distributed systems [S2].

Try CloudSync today with our free tier including 100,000 events per month!
"""

# Sample run state
sample_run_state = {
    "run_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": datetime.now().isoformat(),
    "config": {
        "prd_text": "CloudSync PRD...",
        "tone": "professional",
        "audience": "software engineers",
        "word_count": 1000,
        "enable_search": False
    },
    "status": "DONE",
    "steps": {
        "final": {
            "markdown": sample_blog
        }
    },
    "citations": [
        {
            "id": "S0",
            "title": "CloudSync Product Requirements Document",
            "url": "internal"
        },
        {
            "id": "S1",
            "title": "WebSocket Performance Best Practices",
            "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"
        },
        {
            "id": "S2",
            "title": "Real-Time Data Synchronization Benchmarks",
            "url": "https://github.com/cloudsync/benchmarks"
        }
    ]
}

if __name__ == "__main__":
    print("🔧 Testing PDF generation...")
    
    try:
        output_path = "test_output.pdf"
        pdf_bytes = generate_pdf_from_run_state(sample_run_state, output_path)
        
        print(f"✅ PDF generated successfully!")
        print(f"📄 Output: {output_path}")
        print(f"📊 Size: {len(pdf_bytes):,} bytes")
        print(f"\n✨ PDF includes:")
        print(f"   • Metadata header (Run ID, tone, audience, word count)")
        print(f"   • Styled blog content with preserved citations")
        print(f"   • Citations section with source references")
        print(f"   • Professional typography and layout")
        print(f"\nOpen {output_path} to preview!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
