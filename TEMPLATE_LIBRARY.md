# Template Library Documentation

## Overview

The Template Library provides 5 pre-built PRD examples covering different industries and use cases. Each template is optimized for a specific word count target to help you quickly test the blog generation pipeline.

## Available Templates

### 1. Quick Feature Update
- **Category**: Product Update
- **Target Word Count**: ~100 words
- **Best For**: Short feature announcements, release notes, minor updates
- **Example Use Case**: Announcing a new dark mode feature
- **Key Sections**:
  - Overview
  - Key features (4-5 bullet points)
  - User benefits
  - Technical requirements
  - Success metrics

---

### 2. Payment API Integration
- **Category**: API Service
- **Target Word Count**: ~200 words
- **Best For**: Technical specifications, API documentation, integration guides
- **Example Use Case**: Payment processing system integration
- **Key Sections**:
  - Executive summary
  - Problem statement
  - Goals and metrics
  - Core features (payment methods, subscriptions, security)
  - Technical architecture
  - Timeline

---

### 3. Fitness Tracking Mobile App
- **Category**: Mobile Application
- **Target Word Count**: ~500 words
- **Best For**: Mobile app launches, consumer product announcements
- **Example Use Case**: Health and fitness tracking application
- **Key Sections**:
  - Executive summary
  - Market opportunity
  - Target users
  - Core value proposition
  - Key features (5 major categories: workout tracking, nutrition, social, goals, technical)
  - Technical architecture
  - Monetization strategy
  - Success metrics
  - Launch timeline
  - Competitive advantages

---

### 4. Project Management SaaS
- **Category**: SaaS Platform
- **Target Word Count**: ~1000 words
- **Best For**: Enterprise SaaS platforms, comprehensive product launches
- **Example Use Case**: Project management and collaboration tool
- **Key Sections**:
  - Executive summary
  - Market analysis
  - User personas
  - Core features (7 major categories: views, tasks, collaboration, automation, reporting, integrations, enterprise)
  - Technical architecture
  - Pricing strategy
  - Go-to-market strategy
  - Success metrics
  - Competitive analysis
  - Risk mitigation
  - Detailed roadmap

---

### 5. AI Writing Assistant
- **Category**: AI Product
- **Target Word Count**: ~500 words
- **Best For**: AI/ML products, productivity tools, content creation platforms
- **Example Use Case**: AI-powered content writing and optimization
- **Key Sections**:
  - Executive summary
  - Market opportunity
  - Target users
  - Core value proposition
  - Key features (7 categories: writing assistance, content generation, optimization, research, collaboration, integrations, customization)
  - Technical architecture
  - Use cases with before/after
  - Pricing (4 tiers)
  - Competitive advantages
  - Success metrics
  - Launch roadmap

---

## Template Features

### Smart Copy Function
- **One-Click Copy**: Click "Use Template" to instantly populate the PRD input field
- **Auto-Scroll**: Automatically scrolls to the textarea after copying
- **Visual Feedback**: Green checkmark confirmation when copied
- **Collapse on Copy**: Template library auto-collapses to focus on editing

### Preview Modal
- **Full Content View**: See the complete PRD before copying
- **Metadata Display**: Category, target word count, and description
- **Syntax Highlighting**: Formatted text for easy reading
- **Quick Actions**: Copy or close from modal

### Responsive Grid
- **1 Column** (Mobile): Stack templates vertically
- **2 Columns** (Tablet): Side-by-side layout
- **3 Columns** (Desktop): Optimal browsing experience

---

## Usage Tips

### For Quick Testing (100-200 words)
Use **Quick Feature Update** or **Payment API Integration** to:
- Test the pipeline in <1 minute
- Verify agent behavior with minimal token usage
- Debug issues quickly
- Demo to stakeholders

### For Standard Blog Posts (500 words)
Use **Fitness App** or **AI Writing Assistant** to:
- Generate marketing blog posts
- Create product launch announcements
- Test fact-checking rigor
- Produce typical content marketing pieces

### For In-Depth Articles (1000 words)
Use **Project Management SaaS** to:
- Generate comprehensive whitepapers
- Create detailed product documentation
- Test maximum token optimization
- Produce thought leadership content

---

## Customization Guide

After copying a template, you can:

1. **Edit Sections**: Modify or remove sections to match your needs
2. **Add Details**: Include specific technical specs, dates, or metrics
3. **Change Tone**: Adjust the tone dropdown (professional → friendly, etc.)
4. **Adjust Length**: Use the word count slider to target different lengths
5. **Enable Web Search**: Add external research for richer content

---

## Template Structure Best Practices

All templates follow blog-friendly structures:

### Clear Hierarchy
- H1 main title
- H2 major sections
- H3 subsections
- Bullet points for features

### Fact-Dense Content
- Specific metrics and numbers
- Technical specifications
- Clear benefits and outcomes
- Competitive advantages

### Citation-Friendly
- Source references (PRD as S0)
- Feature specifications
- Technical requirements
- Success metrics

---

## Adding Your Own Templates

Want to create custom templates? Follow this structure:

```typescript
{
  id: "unique-slug",
  title: "Display Name",
  category: "Category Name",
  targetWords: 500,
  description: "One-sentence description for card",
  content: `# Your PRD Content Here

## Section 1
Details...

## Section 2
More details...`
}
```

Add to `frontend/lib/templates.ts` in the `PRD_TEMPLATES` array.

---

## Performance Considerations

### Token Usage by Template

| Template | Approx Input Tokens | Approx Output Tokens | Total Runtime |
|----------|---------------------|----------------------|---------------|
| Quick Feature (100w) | ~300 | ~600 | 30-60 seconds |
| Payment API (200w) | ~600 | ~1,200 | 60-90 seconds |
| Fitness App (500w) | ~1,500 | ~3,000 | 2-3 minutes |
| Project Mgmt (1000w) | ~3,000 | ~6,000 | 3-5 minutes |
| AI Assistant (500w) | ~1,500 | ~3,000 | 2-3 minutes |

### Rate Limit Tips
- Start with shorter templates (100-200 words) for initial testing
- Use model fallback chain (auto-switches on rate limits)
- Space out runs by 1-2 minutes if on free tier

---

## Template Categories

### Product Update
- Quick announcements
- Feature releases
- Version updates
- Bug fix communications

### API Service
- Integration guides
- Technical specifications
- Developer documentation
- Service descriptions

### Mobile Application
- App launches
- Feature showcases
- User guides
- Marketing materials

### SaaS Platform
- Product launches
- Feature deep-dives
- Enterprise solutions
- Competitive positioning

### AI Product
- Machine learning products
- Automation tools
- Intelligent assistants
- Predictive analytics

---

## Future Template Ideas

Vote for what you'd like to see:
- [ ] E-commerce Product Launch
- [ ] DevOps Tool Integration
- [ ] Data Analytics Platform
- [ ] Healthcare Application (HIPAA)
- [ ] EdTech Learning Platform
- [ ] FinTech Payment Solution
- [ ] IoT Device Management
- [ ] Blockchain/Web3 Product
- [ ] Gaming Platform
- [ ] Cybersecurity Tool

---

## Feedback

Found an issue with a template? Have suggestions?
- Open an issue on GitHub
- Tag templates that generated excellent results
- Share your blog post outputs
- Suggest new template categories

---

## Template Maintenance

Templates are regularly updated for:
- **Accuracy**: Ensuring realistic technical details
- **Diversity**: Covering more industries and use cases
- **Quality**: Optimizing for best blog output
- **Length**: Balancing detail with token efficiency

Last updated: February 9, 2026
