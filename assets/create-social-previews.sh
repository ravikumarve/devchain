#!/bin/bash

# DevChain Social Preview Image Generator
# This script helps create social preview images for GitHub and social media

echo "🎨 DevChain Social Preview Generator"
echo "======================================"
echo ""

# Check for required tools
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick found - can generate images directly"
    HAS_IMAGEMAGICK=true
elif command -v chromium &> /dev/null || command -v google-chrome &> /dev/null; then
    echo "✅ Chrome/Chromium found - can screenshot HTML"
    HAS_CHROME=true
else
    echo "⚠️  No image generation tools found"
    echo "   Please install either:"
    echo "   - ImageMagick: sudo apt-get install imagemagick"
    echo "   - Chrome/Chromium: sudo apt-get install chromium-browser"
    echo ""
    echo "📋 Alternative: Use online tools like Canva or Figma"
    echo "   See: social-preview-instructions.md"
    exit 1
fi

echo ""
echo "📐 Social Preview Specifications:"
echo "   - GitHub Social: 1200x630px"
echo "   - Open Graph: 1200x630px"
echo "   - Twitter Card: 1200x600px"
echo ""

# Create images if ImageMagick is available
if [ "$HAS_IMAGEMAGICK" = true ]; then
    echo "🖼️  Generating images with ImageMagick..."
    
    # GitHub Social Preview
    convert -size 1200x630 xc:'#0f1117' \
        -font DejaVu-Sans-Bold -pointsize 48 -fill '#7C3AED' \
        -gravity center -annotate +0-100 '🚀 DevChain' \
        -font DejaVu-Sans -pointsize 24 -fill '#e2e8f0' \
        -annotate +0-40 'Developer Marketplace' \
        -font DejaVu-Sans -pointsize 18 -fill '#9F67FF' \
        -annotate +0+10 'SHA-256 Verified Ownership' \
        -font DejaVu-Sans -pointsize 14 -fill '#94a3b8' \
        -annotate +0+60 'React 19 • Node.js • TypeScript • Stripe' \
        github-social.png
    
    echo "   ✅ Created github-social.png"
    
    # Open Graph Image
    cp github-social.png opengraph.png
    echo "   ✅ Created opengraph.png"
    
    # Twitter Card
    convert -size 1200x600 xc:'#0f1117' \
        -font DejaVu-Sans-Bold -pointsize 42 -fill '#7C3AED' \
        -gravity center -annotate +0-80 '🚀 DevChain' \
        -font DejaVu-Sans -pointsize 20 -fill '#e2e8f0' \
        -annotate +0-30 'Developer Marketplace' \
        -font DejaVu-Sans -pointsize 16 -fill '#9F67FF' \
        -annotate +0+10 'SHA-256 Verified Ownership' \
        twitter-card.png
    
    echo "   ✅ Created twitter-card.png"
    
    echo ""
    echo "🎉 All social preview images created successfully!"
    echo ""
    echo "📁 Generated files:"
    ls -lh github-social.png opengraph.png twitter-card.png 2>/dev/null || echo "   (Some files may not have been created)"
    
elif [ "$HAS_CHROME" = true ]; then
    echo "📸 To create images from HTML:"
    echo "   1. Open github-social-preview.html in Chrome"
    echo "   2. Take a screenshot at 1200x630px"
    echo "   3. Save as github-social.png"
    echo "   4. Repeat for other sizes"
    echo ""
    echo "💡 Or use Chrome headless:"
    echo "   chromium --headless --screenshot=github-social.png --window-size=1200,630 github-social-preview.html"
fi

echo ""
echo "📋 Next Steps:"
echo "   1. Review the generated images"
echo "   2. Update web app to reference them"
echo "   3. Test on social media preview tools"
echo "   4. Commit to repository"
