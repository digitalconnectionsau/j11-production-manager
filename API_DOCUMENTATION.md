# J11 Production Manager API Documentation

> **Status:** Current as of October 6, 2025
> **Purpose:** Document existing API endpoints to identify inconsistencies and standardize responses

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Formats

### Frontend ApiResponse Wrapper
The frontend `apiRequest` utility wraps all responses in:
```typescript
interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;      // Only present on success
  error?: string; // Only present on failure
}
```

### Backend Raw Responses
Backend endpoints return data directly without wrapper (inconsistent with frontend expectations).

---

## API Endpoints

## Authentication (`/api/auth`)

### POST `/api/auth/login`
**Purpose:** User authentication
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": number,
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

### POST `/api/auth/register`
**Purpose:** User registration
**Body:** TBD (need to check implementation)

---

## Jobs (`/api/jobs`)

### GET `/api/jobs`
**Purpose:** Get all jobs with project and client info
**Auth Required:** Yes (`view_jobs` permission)
**Response:**
```json
[
  {
    "id": number,
    "projectId": number,
    "unit": "string",
    "type": "string", 
    "items": "string",
    "nestingDate": "string", // DD/MM/YYYY format
    "machiningDate": "string",
    "assemblyDate": "string", 
    "deliveryDate": "string",
    "status": "string", // Legacy enum field
    "statusId": number,
    "comments": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "projectName": "string",
    "clientName": "string",
    "statusInfo": {
      "id": number,
      "name": "string",
      "displayName": "string",
      "color": "string", // hex color
      "backgroundColor": "string", // hex color
      "isDefault": boolean,
      "isFinal": boolean,
      "targetColumns": array
    } | null
  }
]
```

### PUT `/api/jobs/:id`
**Purpose:** Update job details
**Auth Required:** Yes (`edit_jobs` permission)
**Body:**
```json
{
  "unit": "string",
  "type": "string",
  "items": "string", 
  "nestingDate": "string",
  "machiningDate": "string",
  "assemblyDate": "string",
  "deliveryDate": "string", 
  "status": "string", // Legacy field
  "statusId": number, // New field
  "comments": "string"
}
```
**Success Response (200):**
```json
{
  // Updated job object (same structure as GET response item)
}
```

**Issues Identified:**
- ❌ Backend returns job object directly, frontend expects `{success: true, data: job}`
- ❌ Dual status system (legacy `status` + new `statusId`) creates confusion
- ⚠️  Frontend was not passing auth token (FIXED)

---

## Projects (`/api/projects`)

### GET `/api/projects`  
**Purpose:** Get all projects with client info and job counts
**Auth Required:** Yes (`view_projects` permission)
**Response:**
```json
[
  {
    "id": number,
    "name": "string",
    "description": "string",
    "status": "string",
    "clientId": number,
    "createdAt": "timestamp", 
    "updatedAt": "timestamp",
    "clientName": "string",
    "clientCompany": "string",
    "jobCount": number,
    "completedJobCount": number,
    "progress": number // percentage
  }
]
```

### GET `/api/projects/:id`
**Purpose:** Get single project with jobs
**Auth Required:** Yes (`view_projects` permission) 
**Response:**
```json
{
  "id": number,
  "name": "string",
  "description": "string", 
  "status": "string",
  "clientId": number,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "clientName": "string",
  "clientCompany": "string",
  "clientEmail": "string",
  "clientPhone": "string",
  "jobs": [
    // Array of job objects (same as GET /api/jobs response items)
  ]
}
```

---

## Job Statuses (`/api/job-statuses`)

### GET `/api/job-statuses`
**Purpose:** Get all available job statuses
**Auth Required:** Yes
**Response:**
```json
[
  {
    "id": number,
    "name": "string", // Internal name (e.g., "not-assigned")
    "displayName": "string", // UI display name
    "color": "string", // Text color (hex)
    "backgroundColor": "string", // Background color (hex)
    "orderIndex": number,
    "isDefault": boolean,
    "isFinal": boolean,
    "targetColumns": array, // Which columns to color
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

---

## Clients (`/api/clients`)

### GET `/api/clients`
**Auth Required:** Yes (`view_clients` permission)
**Response:**
```json
[
  {
    "id": number,
    "name": "string", // Short name for daily use
    "company": "string", // Official company name  
    "email": "string",
    "phone": "string",
    "address": "string",
    "abn": "string", // Australian Business Number
    "contactPerson": "string",
    "notes": "string",
    "isActive": boolean,
    "archived": boolean,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

---

## Test Results (October 6, 2025)

### API Connectivity Test Results:
- ❌ **No health endpoint** (`/api/health` returns 404)
- ❌ **Login failing** - No valid test credentials found
- ⏭️ **Protected endpoints untestable** without authentication
- 🔍 **Need to verify user accounts** in database

## Known Issues & Inconsistencies

### 🚨 Critical Issues
1. **Response Format Mismatch:** Frontend expects `{success, data}` wrapper, backend returns raw data
2. **Dual Status System:** Jobs have both `status` (enum) and `statusId` (FK) causing confusion  
3. **Authentication Gaps:** Frontend wasn't passing tokens to job update API (FIXED)
4. **No Health Endpoint:** Missing basic connectivity check endpoint
5. **Unknown User Credentials:** Cannot test API without valid user accounts

### ⚠️ Potential Issues
1. **Date Format Inconsistency:** Australian DD/MM/YYYY in database, various formats in frontend
2. **Error Handling:** Inconsistent error response formats across endpoints
3. **Permission System:** Complex permission checks may have gaps
4. **Missing API Validation:** No request/response schema validation

### 💡 Recommendations
1. **Standardize Response Format:** All endpoints should return consistent format
2. **Migrate to Single Status System:** Remove legacy status enum, use only statusId
3. **Add API Versioning:** Prepare for future changes
4. **Comprehensive Error Handling:** Standardize error responses
5. **Add Request/Response Validation:** Use schema validation (Zod)

---

*This documentation is a work in progress. More endpoints and details to be added.*