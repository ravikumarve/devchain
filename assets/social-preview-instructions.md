# Social Preview Images for DevChain

This directory should contain social preview images for GitHub and social media sharing.

## Required Images

### 1. GitHub Social Preview (1200x630px)
- **File**: `github-social.png`
- **Purpose**: GitHub repository preview, social media sharing
- **Content**: 
  - DevChain logo/branding
  - Tagline: "Developer Marketplace with SHA-256 Verified Ownership"
  - Visual: Modern, developer-focused design
  - Colors: Purple (#7C3AED), Indigo (#9F67FF), Dark theme

### 2. Open Graph Image (1200x630px)
- **File**: `opengraph.png`
- **Purpose**: Social media sharing (Twitter, LinkedIn, Facebook)
- **Content**: Same as GitHub social preview

### 3. Twitter Card (1200x600px)
- **File**: `twitter-card.png`
- **Purpose**: Twitter sharing
- **Content**: Optimized for Twitter's card format

## Design Guidelines

### Color Palette
- Primary: #7C3AED (Purple)
- Secondary: #9F67FF (Indigo)
- Background: #0f1117 (Dark)
- Text: #ffffff (White)
- Accent: #059669 (Green for success)

### Typography
- Headlines: Bold, modern sans-serif
- Body: Clean, readable sans-serif
- Code: Monospace for technical elements

### Elements to Include
1. DevChain branding/logo
2. Tagline about SHA-256 ownership
3. Visual elements suggesting:
   - Digital products
   - Security/cryptography
   - Developer tools
   - Marketplace functionality

## Tools to Create These Images

### Online Tools
- **Canva**: https://www.canva.com/
- **Figma**: https://www.figma.com/
- **Photopea**: https://www.photopea.com/ (Free Photoshop alternative)

### Command Line Tools
- **ImageMagick**: For programmatic image creation
- **Pillow (Python)**: For Python-based image generation

### Example ImageMagick Command

```bash
convert -size 1200x630 xc:#0f1117 \
  -font Arial -pointsize 48 -fill white \
  -gravity center -annotate +0-100 "DevChain" \
  -pointsize 24 -fill "#7C3AED" \
  -annotate +0+0 "Developer Marketplace" \
  -pointsize 18 -fill "#9F67FF" \
  -annotate +0+50 "SHA-256 Verified Ownership" \
  github-social.png
```

## Implementation

Once you have created the images:

1. Place them in this `assets/` directory
2. Update `index.html` in the web app to reference them:
   ```html
   <meta property="og:image" content="/assets/opengraph.png">
   <meta name="twitter:card" content="summary_large_image">
   <meta name="twitter:image" content="/assets/twitter-card.png">
   ```

3. For GitHub, the repository will automatically use `github-social.png` if present

## Current Status

⚠️ **Placeholder**: These images need to be created. The current README references `assets/demo.gif` which should be replaced with actual images.

## Next Steps

1. Create the social preview images using the guidelines above
2. Test them on social media preview tools
3. Update the repository metadata
4. Add them to the web app for proper social sharing
