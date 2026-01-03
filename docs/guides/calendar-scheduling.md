# Calendar & Scheduling Guide

Spritz integrates with Google Calendar to enable scheduling, availability management, and shareable scheduling links.

## Overview

Calendar features include:
- **Google Calendar Sync**: Connect your Google Calendar
- **Availability Windows**: Set recurring availability
- **Scheduling Links**: Create shareable booking links
- **Call Scheduling**: Schedule calls with friends (coming soon)
- **x402 Payments**: Charge for scheduled calls (coming soon)

## Connecting Google Calendar

### Initial Setup

1. Navigate to Settings → Calendar
2. Click "Connect Google Calendar"
3. Authorize Spritz to access your calendar
4. Grant necessary permissions
5. Calendar will sync automatically

### Permissions Required

- **Read Calendar**: View your events
- **Create Events**: Schedule new events
- **Modify Events**: Update existing events

## Availability Windows

### Setting Availability

Create recurring availability windows:

1. Go to Calendar Settings
2. Click "Add Availability Window"
3. Configure:
   - **Days**: Which days of the week
   - **Time Range**: Start and end time
   - **Timezone**: Your timezone
   - **Duration**: Meeting duration options
4. Save your availability

### Example Availability

```
Monday - Friday: 9:00 AM - 5:00 PM (PST)
Available for: 30min, 60min meetings
```

## Scheduling Links

### Create Shareable Link

1. Go to Scheduling Settings
2. Click "Create Shareable Link"
3. Configure link settings:
   - **Name**: Link identifier
   - **Availability**: Which windows to use
   - **Duration**: Default meeting length
   - **Buffer Time**: Time between meetings
4. Get your shareable link
5. Share with others

### Using a Scheduling Link

1. Open the scheduling link
2. See available time slots
3. Select a time that works
4. Provide your information
5. Confirm the booking
6. Calendar event is created automatically

## Timezone Handling

Spritz handles timezones automatically:
- **User Timezone**: Detected from browser
- **Availability**: Stored in your timezone
- **Display**: Shown in viewer's timezone
- **Events**: Created in correct timezone

## API Reference

### Connect Calendar

```typescript
GET /api/calendar/connect
// Redirects to Google OAuth
```

### Get Calendar Status

```typescript
GET /api/calendar/status
// Returns connection status
```

### Get Availability

```typescript
GET /api/calendar/availability?startDate=2024-01-01&endDate=2024-01-31
```

### Set Availability Window

```typescript
POST /api/calendar/availability
{
  "dayOfWeek": 1, // Monday
  "startTime": "09:00",
  "endTime": "17:00",
  "timezone": "America/Los_Angeles",
  "durationMinutes": [30, 60]
}
```

### Create Shareable Link

```typescript
POST /api/scheduling/create-shareable
{
  "name": "consultation",
  "availabilityWindows": [...],
  "defaultDuration": 60
}
```

### Get Public Schedule

```typescript
GET /api/public/schedule/:slug
```

## Best Practices

1. **Keep Updated**: Regularly update your availability
2. **Buffer Time**: Add buffer time between meetings
3. **Clear Communication**: Set clear expectations
4. **Timezone Awareness**: Be mindful of timezones
5. **Link Management**: Organize your scheduling links

## Troubleshooting

### Calendar Not Syncing

- Reconnect your Google Calendar
- Check permissions in Google account
- Verify OAuth token is valid
- Check for API errors

### Availability Not Showing

- Verify availability windows are set
- Check timezone settings
- Ensure windows don't conflict
- Verify calendar connection

### Scheduling Errors

- Check calendar permissions
- Verify time slot availability
- Check for conflicting events
- Review error messages

## Next Steps

- Learn about [x402 Payments](/docs/agents/x402)
- Explore [Profile Settings](/docs/guides/profile-settings)
- Check out [API Reference](/docs/api/intro)

