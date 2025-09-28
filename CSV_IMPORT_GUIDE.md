# CSV Import Instructions

Your CSV data format is now **FULLY SUPPORTED**! 

## ✅ What Works Now:

### **Headers (flexible matching)**
- Customer → Project reference (currently ignored, uses selected project)
- Job/Unit → Unit field  
- Type → Type field
- Items → Items field (required)
- Nesting → Nesting Date
- Machining → Machining Date  
- Assembly → Assembly Date
- Delivery → Delivery Date
- Status → Auto-mapped to system statuses

### **Status Mapping**
- "Delivery Complete" → "delivered"
- "Assembly Complete" → "assembly-complete" 
- "Machining Complete" → "machining-complete"
- "Nesting Complete" → "nesting-complete"
- "Not assigned" → "not-assigned"

### **Date Handling**
- ✅ Handles #VALUE! errors (converts to empty)
- ✅ Converts various date formats to DD/MM/YYYY
- ✅ Skips invalid dates gracefully

## 🚀 How to Use:

1. **Export from Excel** as CSV or Tab-delimited text
2. **Upload in app** - it will auto-detect the format
3. **Preview & validate** - see what gets imported
4. **Import** valid jobs

## 📝 Before You Import:

1. First create a **Client** called "Hutchinsons" 
2. Create a **Project** called "Yves" under that client
3. Then use bulk upload to import all the jobs to that project

The app will now handle your exact CSV format without requiring any changes!

Try it now - the app should no longer crash and should show you a preview of the parsed data.