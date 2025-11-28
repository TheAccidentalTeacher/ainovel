# Book Cover Generator - Prompt Guide

**Quick Start Guide**: Use this document to create professional book covers with our AI-powered wizard.

---

## 🚀 Access the Book Cover Designer

**Direct Link**: http://localhost:5173/projects/{YOUR_PROJECT_ID}/cover-designer

Replace `{YOUR_PROJECT_ID}` with your actual project ID from the projects list.

---

## 📋 Step-by-Step Prompts

Use these prompts at each step to get the best results from the AI cover generator.

### Step 1: Story Analysis (Auto-runs)
**What It Does**: Extracts genre, tone, themes, and visual elements from your story.

**No Action Needed** - This step runs automatically when you open the designer.

**What You'll See**:
- Genre and subgenre classification
- Tone and mood analysis
- Key themes and visual elements
- Setting details

---

### Step 2: Design Brief Generation (Auto-runs)
**What It Does**: Claude AI generates professional design specifications based on your story analysis.

**No Action Needed** - This step triggers automatically after analysis.

**What You'll Get**:
- Color scheme recommendations (primary, accent, background)
- Typography suggestions (title and author fonts)
- Visual approach (character, iconography, typography-led, location)
- DALL-E 3 optimized prompt
- Genre-appropriate design conventions

---

### Step 3: Image Generation
**What It Does**: Creates 3 professional cover variations using DALL-E 3.

> **Important:** All prompts now describe **"ultra high-end digital artwork"** and explicitly forbid text so DALL-E doesn't render literal books on tables. Do **not** reintroduce the words "book cover" or "typography" into your custom prompts—let the typography step handle text overlays.

**Action Required**: Click "Generate Images" button

**What Happens**:
- DALL-E 3 creates 3 unique variations
- Each follows your design brief specifications
- Portrait orientation (1024×1792) for book covers
- High-quality, professional results

**Customization Options** (Advanced):
- Number of variations (default: 3)
- Style: "vivid" or "natural"
- Quality: "standard" or "hd"

---

### Step 4: Typography Overlay
**What It Does**: Adds your book title and author name with professional positioning.

#### Required Information:

**Book Title**:
```
Example: "The Silent Garden"
Tips:
- Use title case
- Keep it concise (2-5 words ideal)
- Consider readability at thumbnail size
```

**Author Name**:
```
Example: "Sarah Mitchell"
Tips:
- First name + Last name
- Or pen name
- Or "by [Your Name]"
```

#### Auto-Populate Recommendations:

**Typography Settings** (Automatically Applied):
- **Title Font**: From design brief (e.g., Montserrat, Cinzel, Roboto)
- **Author Font**: From design brief (e.g., Open Sans, Garamond)
- **Auto-Positioning**: Enabled by default
  - Title: Top third, centered
  - Author: Bottom, centered
- **Text Color**: Auto-calculated for optimal contrast
- **Shadow Effects**: Automatically added for readability

**Manual Overrides** (Optional):
- Custom title font
- Custom author font
- Custom text colors (hex codes)
- Manual positioning (x, y coordinates)

---

### Step 5: Export to Multiple Formats
**What It Does**: Downloads your cover in print-ready and marketing formats.

#### Available Export Formats:

**1. Amazon KDP Ebook**
- **Dimensions**: 1600 × 2560 pixels
- **DPI**: 300
- **Format**: JPEG
- **Use For**: Kindle ebooks, Amazon listings
- **File Name**: `cover_ebook.jpg`

**2. Print Cover (6×9")**
- **Dimensions**: 1800 × 2700 pixels (6" × 9" at 300 DPI)
- **DPI**: 300
- **Format**: JPEG
- **Use For**: Print-on-demand paperbacks (KDP, IngramSpark)
- **File Name**: `cover_print.jpg`
- **Note**: Front cover only (full wrap with spine in Phase 4)

**3. Instagram Square**
- **Dimensions**: 1080 × 1080 pixels
- **Format**: JPEG
- **Use For**: Instagram posts, Facebook, social media
- **File Name**: `cover_social_square.jpg`

**4. Website Thumbnail**
- **Dimensions**: 400 × 640 pixels
- **Format**: JPEG
- **Use For**: Website, blog, email newsletters
- **File Name**: `cover_thumbnail.jpg`

---

## 🤖 Auto-Populate Feature

### Quick Start Templates by Genre

Copy and paste these into the Typography step for instant professional results:

#### Romance
```
Title: Hearts in Harmony
Author: Emma Rose
Genre: Contemporary Romance
Mood: Warm, passionate, hopeful
```

#### Thriller/Mystery
```
Title: The Last Witness
Author: Michael Cross
Genre: Psychological Thriller
Mood: Dark, tense, suspenseful
```

#### Fantasy
```
Title: Kingdom of Shadows
Author: L.K. Sterling
Genre: Epic Fantasy
Mood: Magical, epic, adventurous
```

#### Science Fiction
```
Title: Beyond the Void
Author: Dr. Alex Kane
Genre: Space Opera
Mood: Futuristic, mysterious, expansive
```

#### Horror
```
Title: Whispers in the Dark
Author: Rachel Graves
Genre: Supernatural Horror
Mood: Terrifying, atmospheric, unsettling
```

#### Literary Fiction
```
Title: The Memory Keeper
Author: Jonathan Pierce
Genre: Literary Fiction
Mood: Contemplative, elegant, profound
```

---

## 🎨 Creative Prompt Engineering

### For DALL-E 3 Image Generation

The system automatically creates optimized prompts that talk about **digital artwork** rather than "book covers" (to avoid DALL-E drawing an actual book). If you craft custom prompts, follow the same pattern:

**Effective Prompt Structure**:
```
[Setting/Scene] + [Visual Style] + [Mood/Atmosphere] + [Key Elements] + [Technical Specs]
```

**Example Prompts by Genre**:

**Romance**:
```
A romantic sunset beach scene with silhouettes of a couple embracing,
warm golden hour lighting, soft focus, pastel pink and orange sky,
elegant and dreamy atmosphere, ultra high-end digital artwork,
portrait orientation, no text anywhere in the image
```

**Thriller**:
```
Dark urban alley at night with dramatic shadows, figure in silhouette
backlit by streetlight, high contrast lighting, moody blue and yellow
color palette, tension and mystery, cinematic composition,
ultra high-end digital artwork, portrait orientation, no typography
```

**Fantasy**:
```
Majestic castle on mountain peak surrounded by swirling magical mist,
glowing ethereal lights, dragons circling in twilight sky,
rich jewel tones of purple and gold, epic fantasy atmosphere,
intricate details, ultra high-end digital artwork, portrait orientation
```

**Science Fiction**:
```
Futuristic space station orbiting alien planet, sleek metallic surfaces,
neon blue and cyan accent lights, starfield background,
advanced technology aesthetic, clean and modern,
ultra high-end digital artwork, portrait orientation, absolutely no text
```

---

## 🔧 Technical Specifications Reference

### Print-Ready Requirements

**Amazon KDP Ebook**:
- Minimum: 1600 × 2560 pixels
- Aspect Ratio: 1:1.6 (height:width)
- DPI: 300 minimum
- Color Mode: RGB
- Format: JPEG or PNG
- Max File Size: 50 MB

**Print Cover (Paperback)**:
- Common Sizes:
  - 5" × 8" = 1500 × 2400 px at 300 DPI
  - 6" × 9" = 1800 × 2700 px at 300 DPI (most common)
  - 5.5" × 8.5" = 1650 × 2550 px at 300 DPI
- Bleed: 0.125" (37.5 pixels at 300 DPI) on all sides
- Safe Zone: 0.25" (75 pixels) from trim edge
- Color Mode: RGB (convert to CMYK for professional printing)
- DPI: 300 minimum

**Social Media**:
- Instagram Square: 1080 × 1080 (1:1)
- Instagram Story: 1080 × 1920 (9:16)
- Facebook Post: 1200 × 630 recommended
- Twitter Card: 1200 × 675 recommended

---

## 💡 Best Practices

### Title Typography

**DO**:
- ✅ Use 2-3 fonts maximum (title, author, tagline)
- ✅ Ensure high contrast between text and background
- ✅ Test readability at 100px width (thumbnail size)
- ✅ Use bold or semi-bold weights for better visibility
- ✅ Keep title above author name in visual hierarchy

**DON'T**:
- ❌ Use more than 3 different fonts
- ❌ Make text too small (minimum 7pt for print)
- ❌ Use low-contrast color combinations
- ❌ Overcrowd with too many design elements
- ❌ Use difficult-to-read decorative fonts for main text

### Color Choices

**Genre-Appropriate Colors**:
- **Romance**: Pinks, purples, warm reds, pastels, jewel tones
- **Thriller**: Dark blues, blacks, yellow accents, high contrast
- **Fantasy**: Jewel tones, purples, golds, rich saturated colors
- **Sci-Fi**: Cool blues, teals, cyans, silvers, neon accents
- **Horror**: Black, red, desaturated tones, high contrast
- **Literary**: Muted sophisticated palettes, unexpected combinations

### Image Selection

**What Works**:
- Simple, bold compositions
- Clear focal point
- Uncluttered backgrounds
- Genre-appropriate imagery
- Professional quality

**What to Avoid**:
- Busy, cluttered compositions
- Multiple competing focal points
- Watermarked images
- Low resolution images
- Generic stock photos

---

## 🎯 Example Workflows

### Workflow 1: Quick Cover (10 minutes)

1. **Open Designer**: Navigate to your project → Click "Design Cover"
2. **Wait for Analysis**: Let AI analyze your story (1 minute)
3. **Review Brief**: Check design recommendations (1 minute)
4. **Generate Images**: Click "Generate Images" → Wait for 3 variations (2-3 minutes)
5. **Select Best**: Choose your favorite variation (1 minute)
6. **Add Typography**: Enter title and author → Click "Apply Typography" (2 minutes)
7. **Export**: Download ebook and print versions (2 minutes)

**Total Time**: ~10 minutes for professional cover

### Workflow 2: Custom Refinement (20-30 minutes)

1. **Analysis & Brief**: Review all recommendations carefully
2. **Generate Images**: Create 3 variations, note which elements you like
3. **Regenerate**: Try different prompts if needed (optional)
4. **Typography Testing**: Try different font combinations
5. **Color Adjustments**: Test custom colors for title/author
6. **Export All Formats**: Download ebook, print, social media versions
7. **Review**: Check at thumbnail size, on different devices

### Workflow 3: Multiple Concepts (45-60 minutes)

1. **First Round**: Generate initial 3 variations
2. **Review & Select**: Choose strongest direction
3. **Second Round**: Regenerate with refined prompt
4. **Typography Testing**: Try 2-3 different typography styles
5. **A/B Testing**: Show to target readers, get feedback
6. **Final Selection**: Choose winner based on feedback
7. **Export All**: Download all formats for all uses

---

## 🔍 Troubleshooting

### Common Issues & Solutions

**Issue**: "Typography not applied properly"
- **Solution**: Make sure you selected an image variation first
- **Check**: Both title and author fields are filled
- **Try**: Refresh and apply typography again

**Issue**: "Export button disabled"
- **Solution**: Complete typography step first
- **Check**: Final image with text is visible in preview
- **Try**: Go back to typography step and apply text

**Issue**: "Generated images don't match my genre"
- **Solution**: Check your project's premise and genre settings
- **Try**: Re-run story analysis with updated premise
- **Advanced**: Provide custom prompt in image generation step

**Issue**: "Text is hard to read on cover"
- **Solution**: Use custom colors with better contrast
- **Try**: Dark background = white text, Light background = black text
- **Advanced**: Edit image contrast before applying typography

**Issue**: "Cover looks different at thumbnail size"
- **Solution**: This is normal - test designs at small size
- **Try**: Simplify design, increase text size, boost contrast
- **Best Practice**: Always check at 100-200px width

---

## 📚 Additional Resources

### Learning Resources
- **Comprehensive Guide**: See `BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md`
- **Implementation Plan**: See `BOOK_COVER_FEATURE_IMPLEMENTATION_PLAN.md`
- **Phase 3 Summary**: See `PHASE_3_COMPLETION_SUMMARY.md`

### External References
- **Amazon KDP Cover Calculator**: https://kdp.amazon.com/cover-calculator
- **Google Fonts**: https://fonts.google.com (free commercial fonts)
- **Color Wheel Tool**: https://www.canva.com/colors/color-wheel/
- **Reedsy Book Cover Guide**: https://reedsy.com/blog/book-cover-design/

### Professional Help
- **Reedsy**: Professional book cover designers
- **99designs**: Design contests
- **Fiverr**: Freelance designers ($50-500)
- **Upwork**: Professional designers ($400-1500)

---

## 🎨 Auto-Populate Templates (Copy & Use)

### Template A: Romance - Contemporary
```javascript
{
  "title": "Summer at Sunset Bay",
  "author": "Sophia Rivers",
  "genre": "Contemporary Romance",
  "subgenre": "Beach Romance",
  "mood": "Warm, hopeful, passionate",
  "themes": ["second chances", "small town", "healing"],
  "keyElements": ["beach sunset", "couple embracing", "warm lighting"],
  "colorScheme": {
    "primary": "#FF6B9D",
    "accent": "#FFD93D",
    "background": "#FFE5EC"
  }
}
```

### Template B: Thriller - Psychological
```javascript
{
  "title": "The Forgotten Room",
  "author": "Marcus Black",
  "genre": "Psychological Thriller",
  "subgenre": "Domestic Suspense",
  "mood": "Dark, tense, mysterious",
  "themes": ["memory", "deception", "paranoia"],
  "keyElements": ["shadow figure", "abandoned house", "fog"],
  "colorScheme": {
    "primary": "#1A1A2E",
    "accent": "#E94560",
    "background": "#16213E"
  }
}
```

### Template C: Fantasy - Epic
```javascript
{
  "title": "Crown of Starlight",
  "author": "Aria Moonwhisper",
  "genre": "Epic Fantasy",
  "subgenre": "High Fantasy",
  "mood": "Magical, epic, adventurous",
  "themes": ["destiny", "magic", "kingdoms"],
  "keyElements": ["crown", "magical energy", "castle"],
  "colorScheme": {
    "primary": "#4A148C",
    "accent": "#FFD700",
    "background": "#1A237E"
  }
}
```

### Template D: Science Fiction - Space Opera
```javascript
{
  "title": "Echoes of Tomorrow",
  "author": "Dr. Nova Sterling",
  "genre": "Science Fiction",
  "subgenre": "Space Opera",
  "mood": "Futuristic, mysterious, expansive",
  "themes": ["time travel", "AI", "space exploration"],
  "keyElements": ["space station", "planet", "stars"],
  "colorScheme": {
    "primary": "#0A2463",
    "accent": "#00D9FF",
    "background": "#1E1E2E"
  }
}
```

### Template E: Horror - Supernatural
```javascript
{
  "title": "The Hollow House",
  "author": "Victoria Graves",
  "genre": "Horror",
  "subgenre": "Supernatural Horror",
  "mood": "Terrifying, atmospheric, unsettling",
  "themes": ["haunting", "isolation", "fear"],
  "keyElements": ["abandoned mansion", "shadows", "mist"],
  "colorScheme": {
    "primary": "#000000",
    "accent": "#8B0000",
    "background": "#1C1C1C"
  }
}
```

---

## ⚡ Quick Reference Command Cheat Sheet

### For Developers/Advanced Users

**API Endpoints**:
```bash
# Story Analysis
POST /api/book-covers/analyze-story
Body: { "project_id": "your-project-id" }

# Design Brief
POST /api/book-covers/generate-brief
Body: { "project_id": "your-project-id" }

# Image Generation
POST /api/book-covers/generate-image
Body: {
  "design_brief_id": "brief-id",
  "num_variations": 3,
  "style": "vivid",
  "quality": "hd"
}

# Typography
POST /api/book-covers/add-typography
Body: {
  "book_cover_id": "cover-id",
  "title_text": "Your Title",
  "author_text": "Author Name",
  "auto_position": true
}

# Export
POST /api/book-covers/export
Body: {
  "book_cover_id": "cover-id",
  "format": "ebook"
}
```

**Format Options**:
- `ebook` - 1600×2560px JPEG
- `print_front` - 1800×2700px JPEG
- `social_square` - 1080×1080px JPEG
- `social_story` - 1080×1920px JPEG
- `thumbnail` - 400×640px JPEG

---

## 🎉 You're Ready to Create!

**Start Here**: http://localhost:5173/projects/{YOUR_PROJECT_ID}/cover-designer

Replace `{YOUR_PROJECT_ID}` with your project ID, and let AI create your professional book cover in minutes!

**Need Help?**
- Check `BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md` for detailed design theory
- Check `PHASE_3_COMPLETION_SUMMARY.md` for technical details
- File an issue if you encounter bugs

**Happy Cover Creating!** 📚✨
