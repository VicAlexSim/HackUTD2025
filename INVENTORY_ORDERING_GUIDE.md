# Voice-Activated Inventory Ordering Guide

## Overview
You can now order inventory parts by speaking to Kramtron in both **John Doe's Feed** (Live Call Mode) and **John Doe2's Feed** (AI Assistant Mode). When you mention ordering a part, the system will automatically detect it, update the inventory, and show a live notification.

## How to Use

### 1. View Current Inventory
- Navigate to the **Inventory** page in the navbar
- Browse available parts by category (Servers, Networking, Storage, Power, Cooling, Cables)
- Note the part numbers (e.g., `SRV-DL380G10`, `NET-CS9300`, `PWR-UPS-APC3000`)

### 2. Order Parts via Voice

#### In John Doe's Feed (Live Call Mode):
1. Click the camera tile to open the call view
2. The chat is automatically listening
3. Say something like:
   - "Can you order part number SRV-DL380G10?"
   - "I need to replace the faulty NET-CS9300 switch"
   - "Please order 2 units of PWR-UPS-APC3000"
   - "The STO-SSD-1TB is broken, we need a new one"

#### In John Doe2's Feed (AI Assistant Mode):
1. Click the camera tile to open the call view
2. Click the "Ask Kramtron" button
3. Speak your order request:
   - "Order a Dell server, part SRV-DL380G10"
   - "Can you get me part number CBL-ETH-CAT6-3M?"
   - "I need 3 cooling fans, part COL-FAN-SRV"

### 3. What Happens Next

When Kramtron detects an order:
1. ✅ **Kramtron acknowledges** the order in the chat
2. 📦 **Inventory is updated** automatically (status changes to "On Order")
3. 🔔 **Notification appears** in the top-right corner showing:
   - Part Number
   - Part Name
   - Quantity Ordered
   - Current Stock Level
   - Status: On Order

### 4. Verify the Order
- Go to the **Inventory** page
- Find the part you ordered
- Status should now show "On Order" with a blue badge
- Last Ordered timestamp is updated
- Notes field shows the voice command that triggered the order

## Example Part Numbers to Try

| Category | Part Number | Name |
|----------|-------------|------|
| Servers | `SRV-DL380G10` | Dell PowerEdge R740 |
| Servers | `SRV-HPPL380G10` | HP ProLiant DL380 Gen10 |
| Networking | `NET-CS9300` | Cisco Catalyst 9300 Switch |
| Storage | `STO-SSD-1TB` | Samsung 1TB NVMe SSD |
| Power | `PWR-UPS-APC3000` | APC Smart-UPS 3000VA |
| Cooling | `COL-FAN-SRV` | Server Cooling Fan |
| Cables | `CBL-ETH-CAT6-3M` | Cat6 Ethernet Cable 3M |

## Natural Language Examples

The system understands various ways of requesting parts:

✅ **Direct**: "Order SRV-DL380G10"
✅ **Conversational**: "Can you order a Dell server for me? The part number is SRV-DL380G10"
✅ **Problem-based**: "The power supply PWR-UPS-APC3000 is faulty, we need a replacement"
✅ **With quantity**: "I need 3 units of COL-FAN-SRV"
✅ **Informal**: "Get me part NET-CS9300 please"

## Troubleshooting

### Order not detected?
- Make sure you mention a valid part number (format: XXX-XXXXXXX)
- Include an "order" keyword like: order, need, replace, get, buy, purchase
- Check the browser console for detection logs

### Notification not showing?
- The notification auto-dismisses after 8 seconds
- Only one notification shows at a time
- Check if the part number exists in inventory

### Inventory not updating?
- Verify the part number matches exactly (case-insensitive)
- Check the Convex dashboard logs for errors
- Make sure the inventory is seeded (run seed function if needed)

## Technical Details

### Backend Flow:
1. Voice input → Nemotron processes the request
2. `detectInventoryOrder()` scans for order keywords + part numbers
3. `processInventoryOrder()` mutation updates the database
4. Response includes `inventoryOrder` object with details
5. Frontend receives order info and displays notification

### Part Number Format:
- Pattern: `XXX-XXXXXXX` (3 letters, dash, alphanumeric)
- Examples: `SRV-DL380G10`, `NET-CS9300`, `PWR-UPS-APC3000`
- Case-insensitive (automatically converted to uppercase)

### Inventory Status:
- `in_stock` → Green badge
- `low_stock` → Yellow badge
- `out_of_stock` → Red badge
- `on_order` → Blue badge (animated pulse)

## Next Steps

Future enhancements could include:
- Order confirmation/cancellation
- Automatic reordering when stock is low
- Integration with actual procurement systems
- Order history and tracking
- Multi-part orders in a single request

