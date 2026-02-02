
# Production Monitoring Dashboard UI

## Overview
Create a new tab in the Super Admin dashboard that displays real-time production monitoring metrics from the `monitoring-dashboard` edge function. This tab will provide Super Admins with visibility into system performance, errors, and alerts.

---

## Architecture

The new `ProductionMonitoringTab` component will:
1. Call the `monitoring-dashboard` edge function to fetch aggregated metrics
2. Display key performance indicators (KPIs) in stat cards
3. Show charts for response times and error distribution
4. List recent alerts and their status
5. Provide time range filtering (1h, 24h, 7d, 30d)

---

## UI Components

### 1. Summary Stats Row (4 cards)
- **Requests/min**: Real-time throughput with trend indicator
- **Error Rate**: Percentage with color-coded severity
- **Avg Response Time**: In milliseconds with P95/P99 breakdown
- **Active Sessions**: Current active users/sessions

### 2. Performance Section
- **Slowest Endpoints Table**: Top 5 endpoints by response time
- **Response Time Distribution Chart**: Line chart showing P50, P95, P99 over time

### 3. Errors Section
- **Error Breakdown by Severity**: Pie chart (critical/error/warning/info)
- **Top Error Endpoints**: Bar chart of endpoints with most errors

### 4. Storage Section
- **Storage by Lab**: Horizontal bar chart showing usage per lab
- **Total Storage**: Progress bar with percentage used

### 5. Alerts Panel
- **Active Alerts**: List of currently triggered alerts
- **Alert History**: Recent 24h alert triggers with resolution status

---

## Time Range Filter
Dropdown selector with options:
- Last 1 hour
- Last 24 hours (default)
- Last 7 days
- Last 30 days

---

## Data Flow

```text
ProductionMonitoringTab
        |
        v
supabase.functions.invoke('monitoring-dashboard', { body: { time_range } })
        |
        v
Parse response and populate state
        |
        v
Render stats, charts, tables
```

---

## Technical Details

### Component Structure
```
src/components/super-admin/ProductionMonitoringTab.tsx
```

### State Management
- `metrics`: Summary data from API
- `loading`: Loading indicator
- `timeRange`: Selected filter ('1h' | '24h' | '7d' | '30d')
- `lastUpdated`: Timestamp of last refresh

### API Response Types
```typescript
interface MonitoringMetrics {
  summary: {
    requests_per_minute: number;
    error_rate_percent: number;
    avg_response_time_ms: number;
    active_sessions: number;
    daily_active_users: number;
  };
  errors: {
    total: number;
    by_severity: {
      critical: number;
      error: number;
      warning: number;
      info: number;
    };
    top_endpoints: Array<{ endpoint: string; count: number }>;
  };
  performance: {
    slowest_endpoints: Array<{ endpoint: string; avg_ms: number; count: number }>;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
  };
  storage: {
    total_usage_mb: number;
    by_lab: Array<{ lab_id: string; lab_name: string; usage_mb: number }>;
  };
  meta: {
    time_range: string;
    generated_at: string;
  };
}
```

### Charts (using Recharts)
- **Error Distribution**: PieChart with severity breakdown
- **Slowest Endpoints**: Horizontal BarChart
- **Storage by Lab**: Horizontal BarChart

### Refresh Strategy
- Auto-refresh every 60 seconds
- Manual refresh button
- Show "Last updated" timestamp

---

## Integration with SuperAdmin.tsx

1. Import the new `ProductionMonitoringTab` component
2. Add a new tab trigger with icon (Gauge or Monitor icon)
3. Add corresponding TabsContent

### Tab Position
Insert after "System Health" tab:
- System Health (existing - business metrics)
- **Production Monitoring (new - technical metrics)**

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/super-admin/ProductionMonitoringTab.tsx` | Create | New monitoring dashboard component |
| `src/pages/SuperAdmin.tsx` | Update | Add tab trigger and content |

---

## Visual Design

### Color Coding
- **Green**: Error rate < 1%, response time < 200ms
- **Yellow**: Error rate 1-5%, response time 200-500ms
- **Red**: Error rate > 5%, response time > 500ms

### Card Layout
```text
+--------+--------+--------+--------+
|  RPM   | Error% |  Avg   |Sessions|
|        |        |Response|        |
+--------+--------+--------+--------+

+--------------------+--------------------+
|  Slowest Endpoints |   Error Severity   |
|     (Table)        |     (Pie Chart)    |
+--------------------+--------------------+

+--------------------+--------------------+
|  Top Error Paths   |  Storage by Lab    |
|   (Bar Chart)      |   (Bar Chart)      |
+--------------------+--------------------+

+----------------------------------------+
|           Active Alerts                 |
|  (List with severity badges)           |
+----------------------------------------+
```

---

## Error Handling

1. Show skeleton loading state during data fetch
2. Display error toast if API call fails
3. Graceful fallback with "No data available" messages
4. Retry button on failure

---

## Security

- Component only renders for `super_admin` role (checked in SuperAdmin.tsx parent)
- Edge function validates JWT and role before returning data
- No sensitive data exposed in UI (only aggregated metrics)
