# Quick Test Commands for Voice Inventory Ordering

## 🎯 Ready-to-Use Test Commands

Copy and paste these commands to test voice ordering:

### Test 1: Simple Server Order
**Say:** "Can you order part number SRV-DL380G10?"

**Expected Result:**
- Kramtron: "I'll order that SRV-DL380G10 server for you right away."
- Notification shows: Dell PowerEdge R740
- Current Stock: 5 units
- Status: On Order

---

### Test 2: Networking Equipment
**Say:** "I need a Cisco switch, part NET-CS9300"

**Expected Result:**
- Kramtron acknowledges the order
- Notification shows: Cisco Catalyst 9300 Switch
- Current Stock: 2 units
- Status: On Order

---

### Test 3: Faulty Part Replacement
**Say:** "The power supply PWR-UPS-APC3000 is broken, we need a replacement"

**Expected Result:**
- Kramtron: "I'll order that PWR-UPS-APC3000 for you right away."
- Notification shows: APC Smart-UPS 3000VA
- Current Stock: 1 unit (Low Stock - Yellow)
- Status: On Order

---

### Test 4: Multiple Units
**Say:** "Order 3 units of COL-FAN-SRV"

**Expected Result:**
- Kramtron acknowledges the order
- Notification shows: Server Cooling Fan
- Quantity Ordered: 3 units
- Current Stock: 20 units
- Status: On Order

---

### Test 5: Out of Stock Item
**Say:** "Can you get me part STO-NVME-2TB?"

**Expected Result:**
- Kramtron acknowledges the order
- Notification shows: Crucial 2TB NVMe SSD
- Current Stock: 0 units (Out of Stock - Red)
- Status: On Order

---

### Test 6: Cable Order
**Say:** "I need ethernet cables, part number CBL-ETH-CAT6-3M"

**Expected Result:**
- Kramtron acknowledges the order
- Notification shows: Cat6 Ethernet Cable 3M
- Current Stock: 50 units
- Status: On Order

---

## 📋 All Available Part Numbers

### Servers (SRV-)
- `SRV-DL380G10` - Dell PowerEdge R740 (5 in stock)
- `SRV-HPPL380G10` - HP ProLiant DL380 Gen10 (3 in stock)
- `SRV-RAM-32GB` - DDR4 32GB RAM Module (15 in stock)
- `SRV-CPU-E5-2690` - Intel Xeon E5-2690 v4 (2 in stock - Low)

### Networking (NET-)
- `NET-CS9300` - Cisco Catalyst 9300 Switch (2 in stock)
- `NET-SFP-10G` - 10G SFP+ Transceiver (8 in stock)
- `NET-FW-PA500` - Palo Alto Networks PA-500 Firewall (1 in stock - Low)

### Storage (STO-)
- `STO-SSD-1TB` - Samsung 1TB NVMe SSD (10 in stock)
- `STO-HDD-8TB` - Seagate 8TB SAS HDD (6 in stock)
- `STO-NVME-2TB` - Crucial 2TB NVMe SSD (0 in stock - Out of Stock)

### Power (PWR-)
- `PWR-UPS-APC3000` - APC Smart-UPS 3000VA (1 in stock - Low)
- `PWR-PDU-16A` - Rack PDU 16A (4 in stock)
- `PWR-SUP-750W` - Server Power Supply 750W (7 in stock)

### Cooling (COL-)
- `COL-FAN-SRV` - Server Cooling Fan (20 in stock)
- `COL-PASTE-THM` - Thermal Paste (12 in stock)

### Cables (CBL-)
- `CBL-ETH-CAT6-3M` - Cat6 Ethernet Cable 3M (50 in stock)
- `CBL-FIB-LC-10M` - Fiber Optic Cable LC-LC 10M (15 in stock)

---

## 🎭 Natural Language Variations

Try these different ways of ordering:

### Formal
- "Please order part number SRV-DL380G10"
- "I would like to order part SRV-DL380G10"

### Casual
- "Get me part SRV-DL380G10"
- "Order SRV-DL380G10"

### Problem-Based
- "The SRV-DL380G10 is faulty, we need a new one"
- "SRV-DL380G10 failed, can you replace it?"

### With Context
- "Can you order a Dell server for me? Part number is SRV-DL380G10"
- "I need a replacement server, the part number is SRV-DL380G10"

---

## ✅ Verification Checklist

After each test, verify:

- [ ] Kramtron acknowledges the order in chat
- [ ] Notification appears in top-right corner
- [ ] Notification shows correct part name
- [ ] Notification shows correct current stock
- [ ] Notification shows "On Order" status with blue badge
- [ ] Notification auto-dismisses after 8 seconds
- [ ] Can manually close notification with X button
- [ ] Inventory page shows updated status
- [ ] Console logs show detection message

---

## 🐛 If Something Doesn't Work

### No notification appears?
1. Check browser console for errors
2. Verify part number exists in inventory
3. Make sure you used an order keyword ("order", "need", "replace", etc.)
4. Check that part number format is correct (XXX-XXXXXXX)

### Kramtron doesn't acknowledge?
1. Check microphone permissions
2. Speak clearly and wait for transcription
3. Try rephrasing with explicit "order" keyword

### Inventory not updating?
1. Refresh the Inventory page
2. Check Convex dashboard for errors
3. Verify part number matches exactly

---

## 🎬 Demo Script

For a smooth demo, follow this sequence:

1. **Start**: "Let me show you voice-activated inventory ordering"
2. **Open Camera**: Click on John Doe2's Feed
3. **Show Inventory**: Navigate to Inventory page, show available parts
4. **Return to Camera**: Go back to the camera feed
5. **Order 1**: "Can you order part number SRV-DL380G10?"
6. **Show Notification**: Point out the notification that appears
7. **Verify**: Go to Inventory page, show it's now "On Order"
8. **Order 2**: "The power supply PWR-UPS-APC3000 is broken, we need a replacement"
9. **Show Low Stock**: Point out the yellow "Low Stock" indicator
10. **Order 3**: "Order 3 units of COL-FAN-SRV"
11. **Show Quantity**: Point out the quantity in the notification
12. **Finish**: "And that's how easy it is to order parts with your voice!"

---

## 📊 Expected Behavior Matrix

| Command Type | Part Status | Expected Notification Color | Expected Inventory Status |
|--------------|-------------|----------------------------|---------------------------|
| Valid part, in stock | In Stock | Green stock indicator | On Order (Blue) |
| Valid part, low stock | Low Stock | Yellow stock indicator | On Order (Blue) |
| Valid part, out of stock | Out of Stock | Red stock indicator | On Order (Blue) |
| Invalid part number | N/A | No notification | No change |
| No order keyword | N/A | No notification | No change |

---

## 🔊 Voice Tips

For best results:
- Speak clearly and at normal pace
- Pause briefly after saying the part number
- Use the full part number (don't abbreviate)
- Include an order keyword ("order", "need", "get", etc.)
- Wait for the microphone to capture your full sentence

---

## 🎯 Success Criteria

A successful test should show:
1. ✅ Voice transcription appears in chat
2. ✅ Kramtron responds with acknowledgment
3. ✅ Notification pops up within 1-2 seconds
4. ✅ All part details are correct
5. ✅ Inventory updates in real-time
6. ✅ Status changes to "On Order"
7. ✅ Notification auto-dismisses after 8 seconds
8. ✅ No console errors

