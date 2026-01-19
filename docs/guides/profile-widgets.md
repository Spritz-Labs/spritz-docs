---
title: Profile Widgets
description: Customize your Spritz profile with Bento-style widgets - maps, music, NFTs, scheduling, and 40+ widget types.
keywords:
    [
        Spritz profile,
        profile widgets,
        bento grid,
        profile customization,
        personal page,
        link in bio,
    ]
sidebar_label: Profile Widgets
---

# Profile Widgets Guide

Create a stunning, personalized profile page with Spritz's Bento-style widget system. Choose from 40+ widget types to showcase your personality, interests, and Spritz features.

## Overview

Profile widgets allow you to:
- **Customize your page**: Drag-and-drop widget arrangement
- **Showcase interests**: Music, books, games, movies
- **Display Web3 identity**: NFTs, wallet addresses, ENS
- **Enable interactions**: Guestbooks, polls, reaction walls
- **Integrate Spritz features**: Scheduling, messaging, AI agents

## Widget Categories

### Spritz Features
Core Spritz integrations for your profile.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Message Me** | Quick link to chat with you | 1x1, 2x1, 2x2 |
| **Wallet** | Display your wallet address | 1x1, 2x1, 2x2 |
| **Let's Meet** | Book a call scheduling link | 1x1, 2x1, 2x2 |
| **AI Agent** | Showcase your AI agent | 1x1, 2x1, 2x2 |
| **Social Link** | Link to social profiles | 1x1, 2x1 |

### Location & Time
Show where you are and when you're available.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Map** | Interactive location map | 1x1, 2x1, 2x2, 4x1, 4x2 |
| **Weather** | Current weather display | 1x1, 2x1 |
| **Clock** | World clock display | 1x1, 2x1 |
| **Time Zone** | Show overlap with visitors | 1x1, 2x1, 2x2 |

### Media & Social
Share your content and social presence.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Image** | Custom uploaded image | All sizes |
| **Video** | YouTube, Vimeo, Loom embed | 2x1, 2x2, 4x2 |
| **Spotify** | Music you love | 2x1, 2x2, 4x1 |
| **GitHub** | Contribution graph | 2x1, 2x2, 4x1, 4x2 |
| **Social Post** | Embed tweets/posts | 2x2, 4x2 |

### Web3
Showcase your on-chain identity.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **NFT** | Display owned NFTs | 1x1, 2x1, 1x2, 2x2 |
| **Tip Jar** | Accept crypto tips | 1x1, 2x1, 2x2 |

### Interactive
Engage visitors with interactive elements.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Poll** | Let visitors vote | 2x1, 2x2 |
| **Guestbook** | Visitor messages | 2x2, 4x2 |
| **Reaction Wall** | Emoji reactions | 1x1, 2x1, 2x2 |
| **Virtual Pet** | Animated companion | 1x1, 2x1, 2x2 |
| **Fortune Cookie** | Random wisdom | 1x1, 2x1, 2x2 |

### Aesthetic
Beautiful visual widgets.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Photo Carousel** | Rotating slideshow | 2x1, 2x2, 4x2 |
| **Mood Board** | Image collage | 2x2, 4x2 |
| **Color Palette** | Brand/favorite colors | 2x1, 4x1 |
| **Vinyl Record** | Spinning album art | 1x1, 2x2 |
| **Polaroid Stack** | Stacked photos | 2x2, 4x2 |
| **Zodiac Sign** | Astrological sign | 1x1, 2x1 |

### Entertainment
What you're into.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Bookshelf** | Books you're reading | 2x1, 2x2, 4x1, 4x2 |
| **Now Playing** | Current game | 2x1, 2x2 |
| **Watch List** | Movies/shows queue | 2x1, 2x2, 4x2 |
| **Podcasts** | Podcasts you love | 2x1, 2x2, 4x1 |

### Productivity
Show your work habits.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Availability** | Status indicator | 1x1, 2x1 |
| **Streak** | Daily streaks | 1x1, 2x1 |
| **Goals** | Public checklist | 2x1, 2x2 |

### Fun & Personal
Express yourself.

| Widget | Description | Sizes |
|--------|-------------|-------|
| **Text** | Quote or custom text | 1x1, 2x1, 2x2, 4x1 |
| **Link** | Custom link preview | 1x1, 2x1, 2x2 |
| **Countdown** | Event countdown | 1x1, 2x1, 2x2 |
| **Stats** | Custom metrics | 2x1, 2x2, 4x1 |
| **Tech Stack** | Technologies you use | 2x1, 2x2, 4x1 |
| **Currently** | What you're doing | 1x1, 2x1, 2x2 |
| **Fun Counter** | Count anything | 1x1, 2x1 |
| **Visitor Counter** | Retro hit counter | 1x1, 2x1 |
| **Random Fact** | Fun facts about you | 2x1, 2x2 |
| **Languages** | Languages you speak | 1x1, 2x1, 2x2 |

---

## Widget Sizes

Widgets use a grid system with these size options:

| Size | Dimensions | Best For |
|------|------------|----------|
| **1x1** | Square | Icons, counters, avatars |
| **2x1** | Wide | Links, stats, music |
| **1x2** | Tall | Images, NFTs |
| **2x2** | Large square | Maps, videos, complex widgets |
| **4x1** | Banner | GitHub graph, color palette |
| **4x2** | Large banner | Mood boards, photo galleries |

---

## Using the Widget Editor

### Adding Widgets

1. Go to your profile page
2. Click **Edit Profile**
3. Click **Add Widget**
4. Select a widget type
5. Configure the widget
6. Drag to position
7. Save changes

### Drag and Drop

Widgets can be rearranged by dragging:
- Drag widgets to reorder
- Widgets auto-snap to grid
- Other widgets shift to accommodate

### Widget Configuration

Each widget has specific configuration options:

**Map Widget Example:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "country": "USA",
  "zoom": 12,
  "style": "dark",
  "label": "Based in"
}
```

**Spotify Widget Example:**
```json
{
  "type": "track",
  "spotifyUri": "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
  "theme": "dark"
}
```

---

## Profile Themes

Customize your profile's appearance with themes:

### Built-in Themes

| Theme | Style |
|-------|-------|
| **Dark** | Clean dark background with orange accents |
| **Midnight** | Deep blue gradient with indigo accents |
| **Sunset** | Purple gradient with pink/orange accents |
| **Ocean** | Blue gradient with cyan accents |
| **Forest** | Green gradient with emerald accents |
| **Light** | Clean light background |

### Custom Theme Options

```typescript
interface ProfileTheme {
    background_type: 'solid' | 'gradient' | 'image' | 'mesh';
    background_value: string;
    accent_color: string;
    secondary_color?: string;
    text_color: string;
    card_style: 'rounded' | 'sharp' | 'pill';
    card_background: string;
    card_border?: string;
    font_family: 'system' | 'inter' | 'mono' | 'serif';
    show_spritz_badge: boolean;
    background_effect?: 'none' | 'sparkles' | 'stars' | 'particles' | 'bubbles' | 'snow';
}
```

### Background Effects

Add animated effects to your profile:

| Effect | Description |
|--------|-------------|
| **None** | No animation |
| **Sparkles** | Twinkling sparkle particles |
| **Stars** | Starfield effect |
| **Particles** | Floating particles |
| **Bubbles** | Rising bubble effect |
| **Snow** | Falling snowflakes |

---

## API Reference

### Get Profile Widgets

```http
GET /api/profile/widgets?address=0x...
```

### Update Profile Widgets

```http
POST /api/profile/widgets
```

**Request Body:**
```json
{
  "widgets": [
    {
      "id": "uuid",
      "widget_type": "map",
      "size": "2x2",
      "position": 0,
      "is_visible": true,
      "config": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "city": "New York"
      }
    }
  ],
  "theme": {
    "background_type": "gradient",
    "background_value": "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)",
    "accent_color": "#6366f1"
  }
}
```

---

## Best Practices

1. **Start simple**: Begin with 4-6 widgets, add more over time
2. **Balance sizes**: Mix large and small widgets for visual interest
3. **Group related widgets**: Put social links together, media together
4. **Use Spritz features**: Message Me and Schedule widgets drive engagement
5. **Keep it updated**: Regularly refresh your "Currently" and "Now Playing" widgets

---

## Related Documentation

- [Profile Settings](/docs/guides/profile-settings) - Basic profile configuration
- [Calendar & Scheduling](/docs/guides/calendar-scheduling) - Set up scheduling links
- [AI Agents](/docs/agents/intro) - Create agents to showcase
