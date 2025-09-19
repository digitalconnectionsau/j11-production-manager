# Code Repetition Analysis - Areas for Further Refactoring

## ✅ **COMPLETED: Table Components**
- **Status**: Fixed with new DataTable component
- **Impact**: ~70% code reduction across Jobs, Projects, Clients, and ProjectDetails
- **Files affected**: Jobs.tsx (714 → 435 lines), Projects_new.tsx (464 lines), ProjectDetails.tsx (802 lines), Clients.tsx (469 lines)

---

## 🔴 **HIGH PRIORITY: API Call Patterns**

### **1. Authentication Headers (20+ occurrences)**
**Pattern Found:**
```tsx
headers: { 'Authorization': `Bearer ${token}` }
```
**Files affected:**
- All page components (Dashboard.tsx, Jobs.tsx, Projects.tsx, Clients.tsx, etc.)
- All modal components (AddJobModal.tsx, AddClientModal.tsx, AddProjectModal.tsx)
- Settings components (UserManagement.tsx, JobStatusManagement.tsx)

**Refactoring Opportunity:**
```tsx
// Create: src/utils/api.ts
export const createAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuth();
  return fetch(url, {
    ...options,
    headers: {
      ...createAuthHeaders(token),
      ...options.headers
    }
  });
};
```

### **2. Loading States (13+ identical patterns)**
**Pattern Found:**
```tsx
const [loading, setLoading] = useState(true);
```
**Files affected:**
- Dashboard.tsx, Jobs.tsx, Projects.tsx, Clients.tsx
- ProjectDetails.tsx, JobDetails.tsx, ClientDetails.tsx
- UserManagement.tsx, AuthContext.tsx

**Refactoring Opportunity:**
```tsx
// Create: src/hooks/useApiCall.ts
export const useApiCall = (url: string, dependencies: any[] = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Standard fetch logic with error handling
  }, dependencies);
  
  return { data, loading, error, refetch };
};
```

### **3. Error Handling (14+ catch blocks)**
**Pattern Found:**
```tsx
} catch (err) {
  console.error('Failed to fetch...', err);
  setError('Failed to load data');
}
```

---

## 🟡 **MEDIUM PRIORITY: UI Components**

### **4. Button Styles (15+ occurrences)**
**Pattern Found:**
```tsx
className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
```
**Files affected:**
- Jobs.tsx, Projects_new.tsx, Settings.tsx
- HolidaysManagement.tsx, UserManagement.tsx
- ImportManagement.tsx, JobStatusManagement.tsx

**Refactoring Opportunity:**
```tsx
// Create: src/components/ui/Button.tsx
export const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  // ...
};
```

### **5. Modal Structure (4+ similar patterns)**
**Pattern Found:**
```tsx
interface AddXModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (item: any) => void;
}
```
**Files affected:**
- AddJobModal.tsx (400+ lines)
- AddClientModal.tsx (400+ lines)
- AddProjectModal.tsx (230+ lines)
- BulkUploadModal.tsx (300+ lines)

**Refactoring Opportunity:**
```tsx
// Create: src/components/ui/Modal.tsx
export const Modal = ({ isOpen, onClose, title, children }) => {
  // Shared modal structure with backdrop, close button, etc.
};

// Create: src/hooks/useModalForm.ts
export const useModalForm = (initialData, onSubmit) => {
  // Shared form state management for modals
};
```

---

## 🟡 **MEDIUM PRIORITY: Date & Data Formatting**

### **6. Date Formatting (12+ occurrences)**
**Pattern Found:**
```tsx
new Date(dateString).toLocaleDateString()
// Various patterns: 'en-AU', no locale, with options
```
**Files affected:**
- ProjectDetails.tsx, JobDetails.tsx, ClientDetails.tsx
- Settings.tsx, HolidaysManagement.tsx, UserManagement.tsx

**Refactoring Opportunity:**
```tsx
// Create: src/utils/dateUtils.ts
export const formatDate = (date: string | Date, locale = 'en-AU') => {
  const d = new Date(date);
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString(locale) : '-';
};

export const formatDateTime = (date: string | Date) => {
  // Consistent datetime formatting
};
```

### **7. Data Validation Patterns**
**Pattern Found:**
```tsx
if (!response.ok) {
  throw new Error('Failed to fetch data');
}
```

---

## 🟢 **LOW PRIORITY: Configuration**

### **8. API URL Constants (13+ duplications)**
**Pattern Found:**
```tsx
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

**Refactoring Opportunity:**
```tsx
// Create: src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_ENDPOINTS = {
  jobs: '/api/jobs',
  projects: '/api/projects',
  clients: '/api/clients',
  // ...
};
```

---

## 📊 **IMPACT ASSESSMENT**

### **Potential Code Reduction by Category:**

1. **API Calls & Auth**: ~40% reduction (200+ lines saved)
2. **UI Components**: ~60% reduction (150+ lines saved)
3. **Modal Components**: ~50% reduction (300+ lines saved)
4. **Loading/Error States**: ~80% reduction (100+ lines saved)
5. **Date Formatting**: ~70% reduction (50+ lines saved)

### **Total Estimated Reduction**: ~800-1000 lines of code

---

## 🛠 **RECOMMENDED REFACTORING ORDER**

### **Phase 1: Foundation** (High Impact, Low Risk)
1. **API Utilities** - Create shared fetch functions with auth
2. **Common Hooks** - useApiCall, useAsyncEffect, useModalForm
3. **Date Utilities** - Centralized date formatting

### **Phase 2: UI Components** (Medium Impact, Medium Risk)
1. **Button Component** - Replace all button variants
2. **Modal Base Component** - Shared modal structure
3. **Input Components** - Form field components

### **Phase 3: Advanced** (High Impact, Higher Risk)
1. **Form Management** - Shared form state and validation
2. **Error Boundaries** - Centralized error handling
3. **Data Fetching Layer** - Complete API abstraction

---

## 💡 **ADDITIONAL OPPORTUNITIES**

### **Form Validation Patterns**
- Repeated email validation in multiple forms
- Similar required field validation logic
- Consistent error message formatting

### **Loading Components**
- Spinner patterns repeated across pages
- Similar skeleton loading states
- Consistent loading message formatting

### **Navigation Patterns**
- Similar breadcrumb implementations
- Repeated back button functionality
- Consistent page header structures

### **Business Logic**
- Status color mapping (partially addressed in DataTable)
- Permission checking patterns
- Data transformation utilities

---

## ✅ **IMMEDIATE WINS** (Can implement today)

1. **API_URL constant** - Move to shared config
2. **Button component** - Replace most common button pattern
3. **Date formatting utility** - Replace toLocaleDateString calls
4. **Auth headers utility** - Replace Bearer token headers

These changes alone would reduce ~200-300 lines of duplicate code with minimal risk.