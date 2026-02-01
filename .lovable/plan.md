
# LabFlow Production Monitoring System

## Overview
Implement a comprehensive production monitoring infrastructure for LabFlow with real-time health checks, error logging, performance metrics, and automated alerting. This enables proactive system monitoring and rapid incident response.

---

## Architecture

```text
+---------------------------+     +---------------------------+
|    health-check Edge Fn   |     |  monitoring-dashboard Fn  |
+---------------------------+     +---------------------------+
            |                                 |
            v                                 v
+-----------------------------------------------------------+
|                    Supabase Database                      |
|  +-------------+  +-------------+  +-------------------+  |
|  | error_logs  |  |system_health|  | endpoint_metrics  |  |
|  +-------------+  +-------------+  +-------------------+  |
+-----------------------------------------------------------+
            |
            v
+---------------------------+
|     Alert Processing      |
|  (check-alerts Edge Fn)   |
+---------------------------+
            |
    +-------+-------+
    |               |
    v               v
  Email           SMS
```

---

## Database Schema

### 1. `error_logs` Table
Stores application errors with automatic 30-day cleanup.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| error_code | text | Error code (e.g., AUTH_001, DB_TIMEOUT) |
| message | text | Error message |
| stack_trace | text | Full stack trace |
| endpoint | text | API endpoint that triggered error |
| lab_id | uuid | Optional lab context |
| branch_id | uuid | Optional branch context |
| user_id | uuid | Optional user context |
| severity | text | info, warning, error, critical |
| metadata | jsonb | Additional context (request body, headers) |
| created_at | timestamptz | Timestamp with auto-cleanup trigger |

### 2. `system_health` Table
Stores periodic health snapshots for trending.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| metric_type | text | db_connection, auth_service, storage_service, etc. |
| metric_value | numeric | Numeric value (response time, count) |
| status | text | ok, warning, error |
| lab_id | uuid | Optional lab-specific metric |
| metadata | jsonb | Additional context |
| recorded_at | timestamptz | Timestamp |

### 3. `endpoint_metrics` Table
Tracks API endpoint performance.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| endpoint | text | API endpoint path |
| method | text | GET, POST, PUT, DELETE |
| response_time_ms | integer | Response time in milliseconds |
| status_code | integer | HTTP status code |
| lab_id | uuid | Optional lab context |
| recorded_at | timestamptz | Timestamp |

### 4. `alert_rules` Table
Configurable alert thresholds.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| rule_name | text | Descriptive name |
| metric_type | text | error_rate, response_time, failed_logins |
| threshold_value | numeric | Threshold to trigger alert |
| comparison | text | gt, lt, eq (greater than, less than, equal) |
| time_window_minutes | integer | Window for aggregation |
| is_active | boolean | Enable/disable rule |
| notification_channels | text[] | ['email', 'sms'] |
| created_at | timestamptz | Timestamp |

### 5. `alert_history` Table
Tracks triggered alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| rule_id | uuid | Reference to alert_rules |
| triggered_at | timestamptz | When alert was triggered |
| resolved_at | timestamptz | When alert was resolved |
| metric_value | numeric | Actual value that triggered alert |
| notification_sent | boolean | Whether notification was sent |
| notification_error | text | Error if notification failed |

---

## Edge Functions

### 1. `health-check` Edge Function
Lightweight endpoint for uptime monitoring.

**Endpoint**: `GET /functions/v1/health-check`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T12:00:00Z",
  "checks": {
    "database": {
      "status": "ok",
      "response_time_ms": 12
    },
    "auth": {
      "status": "ok",
      "response_time_ms": 8
    },
    "storage": {
      "status": "ok",
      "response_time_ms": 15
    }
  },
  "version": "1.0.0"
}
```

**Checks performed**:
1. **Database**: Simple query (`SELECT 1`)
2. **Auth service**: Validate service role key
3. **Storage**: List buckets

### 2. `monitoring-dashboard` Edge Function
Aggregated metrics for admin dashboard.

**Endpoint**: `POST /functions/v1/monitoring-dashboard`

**Request** (optional filters):
```json
{
  "time_range": "24h",
  "lab_id": "uuid"
}
```

**Response**:
```json
{
  "summary": {
    "requests_per_minute": 45.2,
    "error_rate_percent": 0.8,
    "avg_response_time_ms": 85,
    "active_sessions": 142,
    "daily_active_users": 89
  },
  "errors": {
    "total_24h": 127,
    "by_severity": {
      "critical": 0,
      "error": 12,
      "warning": 115
    },
    "top_endpoints": [
      { "endpoint": "/api/patients", "count": 45 },
      { "endpoint": "/api/bills", "count": 32 }
    ]
  },
  "performance": {
    "slowest_endpoints": [
      { "endpoint": "/api/reports/export", "avg_ms": 450 },
      { "endpoint": "/api/bills/search", "avg_ms": 280 }
    ],
    "p95_response_time_ms": 220,
    "p99_response_time_ms": 450
  },
  "storage": {
    "total_usage_mb": 4521,
    "by_lab": [
      { "lab_name": "Lab A", "usage_mb": 1200 },
      { "lab_name": "Lab B", "usage_mb": 890 }
    ]
  }
}
```

### 3. `check-alerts` Edge Function
Scheduled function to evaluate alert rules.

**Trigger**: Cron job every 5 minutes

**Logic**:
1. Fetch active alert rules
2. For each rule, aggregate metrics within time window
3. Compare against thresholds
4. If triggered, send notifications and log to alert_history
5. Auto-resolve alerts when conditions normalize

---

## Alert Rules (Pre-configured)

| Rule | Metric | Threshold | Window |
|------|--------|-----------|--------|
| High Error Rate | error_rate | > 5% | 15 min |
| Slow Response | avg_response_time | > 500ms | 10 min |
| Login Attacks | failed_logins | > 10/min | 5 min |
| Database Slow | db_response_time | > 1000ms | 5 min |
| Storage Critical | storage_usage | > 90% | 1 hour |

---

## Database Functions

### `log_application_error()`
RPC function to log errors from edge functions.

```sql
CREATE OR REPLACE FUNCTION log_application_error(
  p_error_code TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL,
  p_lab_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'error',
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID
```

### `get_monitoring_metrics()`
RPC function for dashboard aggregation.

```sql
CREATE OR REPLACE FUNCTION get_monitoring_metrics(
  p_time_range INTERVAL DEFAULT '24 hours',
  p_lab_id UUID DEFAULT NULL
) RETURNS JSONB
```

### `cleanup_old_error_logs()`
Scheduled function for 30-day cleanup.

```sql
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER -- Returns count of deleted rows
```

---

## RLS Policies

### `error_logs`
- Super Admin: Full read access
- Lab Admin: Read errors for their lab only
- Others: No access

### `system_health`
- Super Admin: Full read access
- Others: No access

### `endpoint_metrics`
- Super Admin: Full read access
- Others: No access

### `alert_rules`
- Super Admin: Full CRUD
- Others: No access

### `alert_history`
- Super Admin: Full read access
- Others: No access

---

## Implementation Tasks

### Phase 1: Database Setup
1. Create `error_logs` table with indexes on (created_at, lab_id, severity)
2. Create `system_health` table with indexes on (recorded_at, metric_type)
3. Create `endpoint_metrics` table with indexes on (recorded_at, endpoint)
4. Create `alert_rules` and `alert_history` tables
5. Create RLS policies for all tables
6. Create `log_application_error()` RPC
7. Create `get_monitoring_metrics()` RPC
8. Create `cleanup_old_error_logs()` function with pg_cron trigger

### Phase 2: Edge Functions
1. Create `health-check` edge function
   - Database connectivity check
   - Auth service check
   - Storage service check
   - Response time measurement
2. Create `monitoring-dashboard` edge function
   - Aggregate metrics from all tables
   - Calculate error rates, response times, DAU
   - Return JSON report
3. Create `check-alerts` edge function
   - Evaluate alert rules
   - Trigger notifications via existing SMS/email functions
   - Log alert history

### Phase 3: Cron Jobs
1. Set up `check-alerts` to run every 5 minutes
2. Set up `cleanup_old_error_logs` to run daily

### Phase 4: Integration
1. Update `supabase/config.toml` with new functions
2. Integrate error logging into existing edge functions
3. Add endpoint metrics collection middleware

---

## Configuration Updates

### supabase/config.toml
```toml
[functions.health-check]
verify_jwt = false

[functions.monitoring-dashboard]
verify_jwt = true

[functions.check-alerts]
verify_jwt = false
```

---

## Cron Job Setup (pg_cron)

```sql
-- Check alerts every 5 minutes
SELECT cron.schedule(
  'check-alerts-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://jlqocytwodbbebrgboaw.supabase.co/functions/v1/check-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb
  );
  $$
);

-- Cleanup old error logs daily at 3 AM
SELECT cron.schedule(
  'cleanup-error-logs',
  '0 3 * * *',
  $$SELECT cleanup_old_error_logs()$$
);
```

---

## File Changes Summary

| File | Action |
|------|--------|
| Migration: Create monitoring tables | Create |
| `supabase/functions/health-check/index.ts` | Create |
| `supabase/functions/monitoring-dashboard/index.ts` | Create |
| `supabase/functions/check-alerts/index.ts` | Create |
| `supabase/config.toml` | Update |

---

## Security Considerations

1. **health-check**: Public endpoint (no JWT) for external uptime monitors
2. **monitoring-dashboard**: Requires authentication, super_admin role
3. **check-alerts**: No JWT but uses service role key internally
4. **Error logs**: Never log sensitive data (passwords, tokens, PII)
5. **Alerts**: Rate-limit notification sending to prevent spam

---

## Success Metrics

After implementation:
- Health check responds in < 50ms
- Dashboard loads metrics in < 500ms
- Alerts fire within 5 minutes of threshold breach
- Error logs auto-cleanup maintains < 30 days of data
- Storage per lab tracked in real-time
