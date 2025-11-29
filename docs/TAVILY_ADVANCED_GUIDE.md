# Advanced Tavily Integration - Full Capabilities Guide

## 🚀 Overview

We've implemented **Tavily's complete feature set** for maximum research power in your AI Novel Generator. Tavily is far more than basic web search—it's an AI-optimized research engine with advanced capabilities.

## 📊 What's New: Full Tavily Feature Set

### 1. **Intelligent Search Type Detection**

The AI automatically chooses the best search method based on your query:

| Query Type | Keywords Detected | Search Method | Credits Used |
|------------|------------------|---------------|--------------|
| **News** | "news", "recent", "current", "latest" | News search with time filter | 2 |
| **Visual** | "image", "photo", "look like", "visual" | Image search with AI descriptions | 2 |
| **Research** | "research", "detailed", "explain", "how" | Deep dive with raw content | 2 |
| **General** | Everything else | Standard advanced search | 2 |

### 2. **Advanced Search Parameters**

#### **Search Depth**
- **Basic** (1 credit): Fast, generic content snippets
- **Advanced** (2 credits): AI-filtered, most relevant chunks, better quality

#### **Topic Types**
- **General**: Standard web search
- **News**: Recent articles with publish dates
- **Finance**: Financial news and data

#### **Time Filtering**
- Recent content only: `time_range="day"`, `"week"`, `"month"`, `"year"`
- Custom date ranges: `start_date="2024-01-01"`, `end_date="2024-12-31"`

#### **Domain Control**
- **Include**: Whitelist trusted sources (max 300 domains)
  ```python
  include_domains=["britannica.com", "wikipedia.org", "smithsonianmag.com"]
  ```
- **Exclude**: Blacklist unwanted sites (max 150 domains)
  ```python
  exclude_domains=["pinterest.com", "amazon.com"]
  ```

#### **Content Depth**
- **chunks_per_source**: 1-10 content chunks per source (advanced only)
- **include_raw_content**: Full page HTML in markdown/text format
- **include_answer**: AI-generated answer ("basic" or "advanced")

#### **Visual Content**
- **include_images**: Query-related image URLs
- **include_image_descriptions**: AI descriptions of each image

## 🎯 Use Cases for Novel Writing

### **Historical Research**
```python
Query: "What was daily life like in Victorian London?"
→ Advanced search
→ 8 sources with detailed chunks
→ Include images of Victorian streets
→ AI-generated comprehensive answer
```

### **Character Appearance**
```python
Query: "Photos of women in their 30s with Mediterranean features"
→ Image search with descriptions
→ 5 results with visual references
→ AI descriptions: "Dark hair, olive skin, sharp features..."
```

### **Current Events for Thriller**
```python
Query: "Recent FBI cybercrime investigations"
→ News search
→ Time range: last month
→ Publish dates included
→ Real case details for authenticity
```

### **Setting Description**
```python
Query: "Describe a 1950s American diner interior"
→ Image search + advanced text
→ Photos of authentic diners
→ Detailed architectural descriptions
```

### **Technical Accuracy**
```python
Query: "How does forensic DNA analysis work?"
→ Deep research dive
→ Domain filter: ncbi.nlm.nih.gov, forensicscienceinstitute.com
→ Raw content for full technical details
→ 10 sources with 5 chunks each
```

## 🛠️ New Search Methods Available

### 1. **Standard Search** (Enhanced)
```python
await search_service.search(
    query="Victorian architecture",
    max_results=10,
    search_depth="advanced",
    include_answer=True,
    include_images=True,
    chunks_per_source=5
)
```

### 2. **News Search**
```python
await search_service.search_news(
    query="artificial intelligence ethics",
    max_results=5,
    time_range="month",  # Last 30 days
    search_depth="advanced"
)
```
**Returns**: Articles with `published_date` field

### 3. **Image Search**
```python
await search_service.search_with_images(
    query="1920s Paris street scenes",
    max_results=5,
    with_descriptions=True  # AI describes each image
)
```
**Returns**: Images + descriptions for character/setting references

### 4. **Deep Research**
```python
await search_service.research_deep_dive(
    query="How do submarines navigate underwater?",
    max_results=10,
    chunks_per_source=5
)
```
**Returns**: Maximum content per source + raw HTML + detailed answer

### 5. **Domain-Specific Search**
```python
await search_service.search_domain_specific(
    query="Ancient Roman military tactics",
    include_domains=["britannica.com", "history.com", "livius.org"],
    max_results=10
)
```
**Returns**: Results from trusted historical sources only

### 6. **URL Extraction** (NEW!)
```python
await search_service.extract_url(
    urls=[
        "https://www.smithsonianmag.com/history/ancient-rome-101",
        "https://en.wikipedia.org/wiki/Roman_legion"
    ],
    include_images=True,
    extract_depth="advanced"
)
```
**Use Case**: Extract specific articles/docs without search

## 🤖 Automatic Intelligence

The chat service now **automatically selects** the best search method:

```python
# User: "What are recent trends in YA fantasy?"
→ Detects "recent" → News search with time_range="month"

# User: "Show me photos of Victorian mansions"
→ Detects "photos" → Image search with descriptions

# User: "I need detailed research on quantum computing"
→ Detects "detailed research" → Deep dive with raw content

# User: "What is a black hole?"
→ Standard advanced search with answer + images
```

## 📈 Response Format

### Standard Search Response
```python
{
    "success": True,
    "query": "Victorian architecture",
    "answer": "Victorian architecture refers to...",  # LLM-generated
    "results": [
        {
            "title": "Victorian Architecture: A Comprehensive Guide",
            "url": "https://...",
            "content": "AI-extracted relevant content...",
            "score": 0.95,  # Relevance score
            "raw_content": "Full page HTML...",  # If include_raw_content=True
            "published_date": "2024-03-15"  # News only
        }
    ],
    "images": [
        {
            "url": "https://...",
            "description": "A Victorian mansion with ornate details..."
        }
    ],
    "response_time": 2.3
}
```

## 💰 Credit Usage

**Free Tier**: 1000 API credits/month

| Operation | Credits | Use When |
|-----------|---------|----------|
| Basic search | 1 | Quick lookups |
| Advanced search | 2 | Important research |
| News search | 2 | Current events |
| Image search | 2 | Visual references |
| Deep research | 2 | Complex topics |
| URL extraction | 0.2/URL (1 per 5) | Specific articles |

**Pro Tips**:
- Use `search_depth="basic"` for quick fact-checks (1 credit)
- Use `search_depth="advanced"` for writing research (2 credits)
- Extract URLs don't use search credits (cheaper for known sources)

## 🎨 Context Formatting

The search service formats results for optimal AI consumption:

```python
=== WEB SEARCH RESULTS ===
Quick Answer: Victorian architecture dominated 1837-1901...

Related Images (3):
- https://image1.jpg: A Victorian mansion with Gothic Revival elements
- https://image2.jpg: Ornate ironwork typical of Victorian homes

Sources:

1. Victorian Architecture Guide
   URL: https://britannica.com/...
   Published: 2024-01-15
   Victorian architecture is characterized by...

2. The Victorian Era: Design & Culture
   URL: https://smithsonianmag.com/...
   Detailed exploration of Victorian design principles...

=== END SEARCH RESULTS ===

User Question: Describe Victorian architecture for my novel
```

## 🔧 Configuration

### Required Setup
```bash
# .env
TAVILY_API_KEY=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
```

### Optional: Domain Whitelists for Novel Research

**Historical Fiction**:
```python
HISTORICAL_DOMAINS = [
    "britannica.com",
    "history.com",
    "smithsonianmag.com",
    "historyextra.com",
    "nationalgeographic.com"
]
```

**Science/Medical**:
```python
SCIENCE_DOMAINS = [
    "ncbi.nlm.nih.gov",
    "nature.com",
    "scientificamerican.com",
    "newscientist.com"
]
```

**News/Current Events**:
```python
NEWS_DOMAINS = [
    "reuters.com",
    "bbc.com",
    "apnews.com",
    "theguardian.com"
]
```

## 🚨 Best Practices

### 1. **Be Specific with Queries**
❌ Bad: "Victorian stuff"
✅ Good: "Victorian architecture interior design 1880s"

### 2. **Use Time Filters for Historical Accuracy**
```python
# For historical novels, exclude very recent content
time_range=None  # All time
# For contemporary thrillers
time_range="week"  # Recent news only
```

### 3. **Trust Score > 0.8**
Results are ranked by relevance. Scores above 0.8 are highly relevant.

### 4. **Combine Search Methods**
```python
# First: Get visual references
images = await search_with_images("Victorian mansion interiors")

# Then: Get detailed descriptions
details = await research_deep_dive("Victorian interior design elements")
```

### 5. **Extract Known Sources**
```python
# If you know good URLs, extract directly (cheaper)
await extract_url([
    "https://www.britannica.com/topic/Victorian-architecture",
    "https://www.architecturaldigest.com/victorian-homes"
])
```

## 🎬 Example Workflows

### **Workflow 1: Character Creation**
```python
# Step 1: Get face reference
faces = await search_with_images(
    "photos professional woman 35 Mediterranean features dark hair",
    max_results=10
)

# Step 2: Research profession
career = await research_deep_dive(
    "daily routine of forensic pathologist",
    max_results=5
)

# Step 3: Get setting details
workplace = await search_with_images(
    "medical examiner office interior",
    max_results=5
)
```

### **Workflow 2: Historical Accuracy**
```python
# Step 1: Time period overview
era = await search_domain_specific(
    "1920s Paris daily life artists",
    include_domains=["britannica.com", "history.com"],
    max_results=10
)

# Step 2: Visual references
visuals = await search_with_images(
    "1920s Paris café street scenes photographs",
    max_results=10
)

# Step 3: Specific details
details = await research_deep_dive(
    "1920s Paris artist lifestyle Montparnasse cafés",
    chunks_per_source=8
)
```

### **Workflow 3: Thriller Research**
```python
# Step 1: Recent cases
news = await search_news(
    "FBI cybercrime investigations",
    time_range="month",
    max_results=5
)

# Step 2: Technical details
tech = await search_domain_specific(
    "cyber forensics investigation methods",
    include_domains=["fbi.gov", "cisa.gov"],
    max_results=10
)

# Step 3: Procedure details
procedure = await research_deep_dive(
    "how FBI traces cryptocurrency transactions",
    chunks_per_source=5
)
```

## 📚 Additional Tavily Features (Not Yet Implemented)

**Future Enhancements**:
- **Tavily Crawl**: Extract entire website sitemaps
- **Tavily Map**: Discover related pages from seed URL
- **Tavily Hybrid RAG**: Search web + local MongoDB knowledge base

Want these? Let me know!

## 🐛 Troubleshooting

### Search Returns No Results
- Query too specific → Broaden search terms
- Domain filters too restrictive → Remove `include_domains`
- Try `search_depth="advanced"` for better AI filtering

### Images Not Appearing
- Set `include_images=True`
- Some queries don't have image results
- Try `search_with_images()` method specifically

### Answer Quality Low
- Use `include_answer="advanced"` for detailed answers
- Increase `max_results` for more context
- Use `research_deep_dive()` for complex topics

### Credits Running Out
- Use `search_depth="basic"` for simple queries (1 credit vs 2)
- Use `extract_url()` for known sources (0.2 credits/URL)
- Cache results in MongoDB to avoid repeat searches

## 🎉 Summary

You now have access to:
- ✅ **5 specialized search methods** (standard, news, images, research, domain-specific)
- ✅ **URL extraction** for known sources
- ✅ **Automatic intelligence** (detects best search type)
- ✅ **Advanced filtering** (time, domains, content depth)
- ✅ **Visual research** (images with AI descriptions)
- ✅ **Detailed answers** (basic or advanced LLM summaries)
- ✅ **Raw content access** (full page HTML for deep research)

This is **far beyond** basic web search—it's a complete research assistant optimized for AI novel writing!

---

**Questions?** Check search service logs for detailed debugging info.
**Want more?** We can add Tavily Crawl (website extraction) or Hybrid RAG (web + local knowledge)!
