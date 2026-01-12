# NFC Tag Implementation for Table Checkout

## Overview

This project uses NFC (Near Field Communication) tags instead of QR codes to allow customers to quickly access the checkout page for their table by simply tapping their phone near the NFC tag.

## How It Works

### 1. **NFC Tag Setup**
Each table has a physical NFC tag placed on it (sticker, card, or embedded). The NFC tag is programmed with the table's checkout URL:

```
https://yourdomain.com/{organizationSlug}/checkout/{tableId}
```

**Example:**
```
https://paga-dreams.com/pizza-palace/checkout/table_abc123
```

### 2. **Customer Flow**
1. Customer sits at a table
2. Customer taps their phone on the NFC tag
3. Phone automatically opens the checkout URL in their browser
4. Customer can view menu, place orders, and pay

### 3. **Analytics Tracking**
When the checkout page loads, it calls the tracking API to record the scan:

```typescript
// In the checkout page
useEffect(() => {
  fetch('/api/nfc-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableId }),
  });
}, [tableId]);
```

## Database Schema

### Table Fields for NFC
```typescript
{
  isNFCEnabled: boolean;      // Can this table accept NFC payments?
  nfcScanCount: number;        // Total number of NFC scans
  lastNfcScanAt: timestamp;    // Last time the NFC tag was scanned
}
```

## API Endpoints

### POST `/api/nfc-scan`
Tracks when an NFC tag is scanned.

**Request:**
```json
{
  "tableId": "table_abc123"
}
```

**Response:**
```json
{
  "success": true
}
```

## Programming NFC Tags

### Tools Needed
- NFC tags (NTAG213/215/216 or similar)
- NFC Tools app (iOS/Android)

### Steps
1. Open NFC Tools app
2. Select "Write"
3. Add a record: "URL/URI"
4. Enter: `https://yourdomain.com/{orgSlug}/checkout/{tableId}`
5. Tap "Write" and hold phone near NFC tag
6. Test by tapping phone on tag

## Checkout URL Format

The checkout URL includes:
- **Organization Slug**: Identifies the restaurant
- **Table ID**: Identifies the specific table

This allows:
- Multi-tenant support (multiple restaurants)
- Table-specific orders and payments
- Analytics per table

## Benefits Over QR Codes

1. **Faster**: Just tap, no need to open camera
2. **No damage**: NFC tags don't degrade like printed QR codes
3. **Reliable**: Works in low light or dirty conditions
4. **Modern**: Better user experience
5. **Analytics**: Track scan counts and patterns

## Security Considerations

- NFC tags are read-only after programming
- URLs are public but tables are validated server-side
- No sensitive data stored on NFC tags
- Rate limiting on scan tracking API

## Future Enhancements

- [ ] Real-time scan notifications
- [ ] Heat maps of popular tables
- [ ] Scan pattern analysis (peak hours)
- [ ] A/B testing different checkout flows
- [ ] Multi-language support based on region
