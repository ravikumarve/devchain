# Demo GIF Creation Instructions

## Overview

This document provides instructions for creating a demo GIF of the DevChain marketplace walkthrough.

## Demo GIF Requirements

- **Format**: GIF
- **Dimensions**: 800x600px (recommended)
- **Duration**: 15-30 seconds
- **File Size**: Under 5MB (for GitHub README)
- **Content**: Marketplace walkthrough showing key features

## Recommended Demo Flow

1. **Landing Page** (2-3 seconds)
   - Show hero section
   - Display "Get Started" button

2. **Marketplace Browse** (4-5 seconds)
   - Scroll through product listings
   - Show filtering options
   - Highlight product cards

3. **Product Detail** (3-4 seconds)
   - Click on a product
   - Show product details
   - Display "Buy Now" button

4. **Purchase Flow** (4-5 seconds)
   - Show purchase modal
   - Display SHA-256 ownership badge
   - Show success message

5. **Profile/Dashboard** (2-3 seconds)
   - Show user purchases
   - Display ownership certificates

## Tools to Create Demo GIF

### Option 1: Simple Screen Recording (Linux)

```bash
# Install recording tools
sudo apt-get install recordmydesktop ffmpeg

# Record screen
recordmydesktop --width=800 --height=600 --output=desktop.ogv

# Convert to GIF
ffmpeg -i desktop.ogv -vf "fps=10,scale=800:-1:flags=lanczos" -c:v gif desktop.gif
```

### Option 2: Using OBS Studio

1. Install OBS Studio: `sudo apt-get install obs-studio`
2. Set recording area to 800x600
3. Record the demo flow
4. Export as GIF using OBS or convert with ffmpeg

### Option 3: Online Tools

- **ScreenToGif**: https://www.screentogif.com/ (Windows)
- **LICEcap**: https://www.cockos.com/licecap/ (Cross-platform)
- **CloudConvert**: https://cloudconvert.com/ (Online converter)

### Option 4: Professional Tools

- **Camtasia**: Full-featured screen recording
- **Adobe Premiere Pro**: Professional video editing
- **Final Cut Pro**: Mac video editing

## Optimization Tips

### Reduce File Size

```bash
# Optimize GIF with ffmpeg
ffmpeg -i input.gif -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif

# Further optimize with gifsicle
gifsicle --optimize=3 --lossy=80 input.gif -o output.gif
```

### Quality Settings

- **Frame Rate**: 10-15 fps (good balance of quality/size)
- **Colors**: 256 colors (GIF standard)
- **Dithering**: Enabled for smooth gradients
- **Compression**: Medium to high

## Demo Script

### Voiceover Script (Optional)

```
"Welcome to DevChain, the developer marketplace with SHA-256 verified ownership.

Browse our curated selection of digital products from developers worldwide.

Each product comes with instant delivery and cryptographic ownership verification.

Purchase securely with Stripe and receive your ownership certificate immediately.

Access your purchases and verify ownership anytime from your dashboard.

Start selling your digital products today!"
```

### Text Overlays

Consider adding text overlays to highlight key features:
- "🛍️ Browse Products" (0:02)
- "🔐 SHA-256 Verified" (0:08)
- "⚡ Instant Delivery" (0:12)
- "📊 Analytics Dashboard" (0:18)

## Current Status

⚠️ **Placeholder**: The demo GIF needs to be created manually.

## Next Steps

1. Choose a recording tool from the options above
2. Record the demo flow following the recommended script
3. Optimize the GIF for web (under 5MB)
4. Test the GIF in different browsers
5. Update README.md to reference the new GIF
6. Commit the GIF to the repository

## Alternative: Static Images

If creating a GIF is not feasible, consider using a carousel of static images:

1. **Landing Page Screenshot**: `demo-1-landing.png`
2. **Marketplace Screenshot**: `demo-2-marketplace.png`
3. **Product Detail Screenshot**: `demo-3-product.png`
4. **Purchase Success Screenshot**: `demo-4-purchase.png`
5. **Dashboard Screenshot**: `demo-5-dashboard.png`

Update README.md to show these images in a grid or carousel format.

## Testing

Before finalizing the demo GIF:

- [ ] Plays smoothly in all major browsers
- [ ] File size is under 5MB
- [ ] All text is readable
- [ ] Key features are clearly visible
- [ ] Duration is appropriate (15-30 seconds)
- [ ] Colors and branding are consistent

## Resources

- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **GIF Optimization Guide**: https://gif.ski/
- **Screen Recording Tips**: https://www.howtogeek.com/

---

**Note**: The demo GIF is a nice-to-have feature. If it's taking too much time, consider using static screenshots or focusing on other launch-critical tasks.
