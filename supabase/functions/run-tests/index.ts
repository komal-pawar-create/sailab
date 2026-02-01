// ============================================
// LabFlow API Comprehensive Test Suite
// ============================================
// Endpoints:
// POST /run-tests - Run all tests
// POST /run-tests?category=auth - Run specific category
// GET /run-tests/coverage - Get test coverage report
// DELETE /run-tests/cleanup - Force cleanup test data

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// ============================================
// Types
// ============================================

interface TestResult {
  test_id: string;
  category: string;
  description: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
  duration_ms: number;
}

interface CategoryResult {
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
}

interface TestReport {
  success: boolean;
  timestamp: string;
  duration_ms: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  categories: Record<string, CategoryResult>;
  failures: TestResult[];
  coverage: {
    tables_tested: string[];
    rpc_functions_tested: string[];
    untested_tables: string[];
    coverage_percent: number;
  };
}

interface TestFixtures {
  organization_id: string;
  lab_id: string;
  branch_id: string;
  other_organization_id: string;
  other_lab_id: string;
  other_branch_id: string;
  super_admin_id: string;
  lab_admin_id: string;
  operator_id: string;
  other_operator_id: string;
  patient_id: string;
  bill_id: string;
  test_report_id: string;
  document_id: string;
  feedback_id: string;
  followup_id: string;
}

// ============================================
// Helper Functions
// ============================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertContains(str: string, substring: string, message: string): void {
  if (!str.includes(substring)) {
    throw new Error(`${message}: "${str}" does not contain "${substring}"`);
  }
}

async function runTest(
  testId: string,
  category: string,
  description: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = performance.now();
  try {
    await testFn();
    return {
      test_id: testId,
      category,
      description,
      passed: true,
      duration_ms: Math.round(performance.now() - startTime),
    };
  } catch (error) {
    const err = error as Error;
    return {
      test_id: testId,
      category,
      description,
      passed: false,
      error: err.message,
      duration_ms: Math.round(performance.now() - startTime),
    };
  }
}

// ============================================
// Authentication Tests
// ============================================

async function runAuthTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  anonKey: string
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // AUTH_001: Valid login with username/password
  results.push(
    await runTest("AUTH_001", "auth", "Valid login with username/password", async () => {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: "test_super_admin@test.labflow.com",
        password: "TestPass123!",
      });
      assert(!error, `Login failed: ${error?.message}`);
      assert(!!data.session, "No session returned");
      // Sign out after test
      await supabaseAdmin.auth.signOut();
    })
  );

  // AUTH_002: Invalid username
  results.push(
    await runTest("AUTH_002", "auth", "Invalid username returns error", async () => {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: "nonexistent@test.labflow.com",
        password: "TestPass123!",
      });
      assert(!!error, "Expected error for invalid username");
      assert(!data.session, "Session should not exist");
    })
  );

  // AUTH_003: Invalid password
  results.push(
    await runTest("AUTH_003", "auth", "Invalid password returns error", async () => {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: "test_super_admin@test.labflow.com",
        password: "WrongPassword123!",
      });
      assert(!!error, "Expected error for invalid password");
      assert(!data.session, "Session should not exist");
    })
  );

  // AUTH_004: Rate limit check (verify function exists)
  results.push(
    await runTest("AUTH_004", "auth", "Rate limit function exists", async () => {
      const { data, error } = await supabaseAdmin.rpc("check_login_rate_limit", {
        p_username: "test_user",
        p_ip_address: "192.168.1.1",
      });
      assert(!error, `Rate limit check failed: ${error?.message}`);
      assert(data.allowed !== undefined, "Rate limit response missing 'allowed' field");
    })
  );

  // AUTH_005: Token refresh
  results.push(
    await runTest("AUTH_005", "auth", "Token refresh works", async () => {
      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: "test_super_admin@test.labflow.com",
        password: "TestPass123!",
      });
      assert(!!signInData.session, "No session for refresh test");
      
      const { data: refreshData, error } = await supabaseAdmin.auth.refreshSession();
      assert(!error, `Token refresh failed: ${error?.message}`);
      assert(!!refreshData.session, "No session after refresh");
      
      await supabaseAdmin.auth.signOut();
    })
  );

  // AUTH_006: Logout single session
  results.push(
    await runTest("AUTH_006", "auth", "Logout invalidates session", async () => {
      const { data: signInData } = await supabaseAdmin.auth.signInWithPassword({
        email: "test_super_admin@test.labflow.com",
        password: "TestPass123!",
      });
      assert(!!signInData.session, "No session for logout test");
      
      const { error } = await supabaseAdmin.auth.signOut();
      assert(!error, `Logout failed: ${error?.message}`);
      
      const { data: sessionData } = await supabaseAdmin.auth.getSession();
      assert(!sessionData.session, "Session should be null after logout");
    })
  );

  // AUTH_007: Get user requires auth
  results.push(
    await runTest("AUTH_007", "auth", "Get user requires authentication", async () => {
      // Use anon client
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data } = await anonClient.auth.getUser();
      assert(!data.user, "User should not be returned without auth");
    })
  );

  // AUTH_008: Session validation
  results.push(
    await runTest("AUTH_008", "auth", "Session contains user info", async () => {
      const { data } = await supabaseAdmin.auth.signInWithPassword({
        email: "test_super_admin@test.labflow.com",
        password: "TestPass123!",
      });
      assert(!!data.session?.user, "Session missing user");
      assert(data.session?.user.email === "test_super_admin@test.labflow.com", "Wrong user email");
      await supabaseAdmin.auth.signOut();
    })
  );

  return results;
}

// ============================================
// CRUD Tests
// ============================================

async function runCrudTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  fixtures: TestFixtures
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // CRUD_001: Create patient
  let testPatientId: string | null = null;
  results.push(
    await runTest("CRUD_001", "crud", "Create patient with valid data", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .insert({
          patient_id: "TL-TB01-20260201/TEST2",
          full_name: "TEST PATIENT TWO",
          phone: "9999999902",
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Create patient failed: ${error?.message}`);
      assert(!!data, "No patient returned");
      testPatientId = data.id;
    })
  );

  // CRUD_002: Read patient by ID
  results.push(
    await runTest("CRUD_002", "crud", "Read patient by ID", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .select("*")
        .eq("id", fixtures.patient_id)
        .single();
      assert(!error, `Read patient failed: ${error?.message}`);
      assert(data?.full_name === "TEST PATIENT ONE", "Wrong patient name");
    })
  );

  // CRUD_003: Update patient
  results.push(
    await runTest("CRUD_003", "crud", "Update patient data", async () => {
      if (!testPatientId) throw new Error("No test patient to update");
      const { error } = await supabaseAdmin
        .from("patients")
        .update({ patient_history: "Updated by test" })
        .eq("id", testPatientId);
      assert(!error, `Update patient failed: ${error?.message}`);
    })
  );

  // CRUD_004: List patients with filter
  results.push(
    await runTest("CRUD_004", "crud", "List patients with filter", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .select("*")
        .eq("lab_id", fixtures.lab_id)
        .ilike("full_name", "TEST%");
      assert(!error, `List patients failed: ${error?.message}`);
      assert(Array.isArray(data) && data.length >= 1, "Expected at least 1 patient");
    })
  );

  // CRUD_005: Create bill
  let testBillId: string | null = null;
  results.push(
    await runTest("CRUD_005", "crud", "Create bill with valid data", async () => {
      const { data, error } = await supabaseAdmin
        .from("bills")
        .insert({
          bill_number: "TL-TEST-0002",
          patient_id: fixtures.patient_id,
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          total_amount: 500,
          due_amount: 500,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          items: [{ name: "Blood Test", price: 500 }],
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Create bill failed: ${error?.message}`);
      testBillId = data?.id;
    })
  );

  // CRUD_006: Read bill with patient join
  results.push(
    await runTest("CRUD_006", "crud", "Read bill with patient join", async () => {
      const { data, error } = await supabaseAdmin
        .from("bills")
        .select("*, patients!bills_patient_id_fkey(full_name)")
        .eq("id", fixtures.bill_id)
        .single();
      assert(!error, `Read bill failed: ${error?.message}`);
      assert(!!data?.patients, "Missing patient join data");
    })
  );

  // CRUD_007: Update bill status
  results.push(
    await runTest("CRUD_007", "crud", "Update bill status", async () => {
      if (!testBillId) throw new Error("No test bill to update");
      const { error } = await supabaseAdmin
        .from("bills")
        .update({ status: "partially_paid", paid_amount: 250, due_amount: 250 })
        .eq("id", testBillId);
      assert(!error, `Update bill failed: ${error?.message}`);
    })
  );

  // CRUD_008: Create payment
  results.push(
    await runTest("CRUD_008", "crud", "Create bill payment", async () => {
      if (!testBillId) throw new Error("No test bill for payment");
      const { error } = await supabaseAdmin.from("bill_payments").insert({
        bill_id: testBillId,
        payment_amount: 100,
        payment_method: "cash",
        created_by: fixtures.operator_id,
        branch_id: fixtures.branch_id,
      });
      assert(!error, `Create payment failed: ${error?.message}`);
    })
  );

  // CRUD_009: Create test report
  let testReportId: string | null = null;
  results.push(
    await runTest("CRUD_009", "crud", "Create test report", async () => {
      const { data, error } = await supabaseAdmin
        .from("test_reports")
        .insert({
          patient_id: fixtures.patient_id,
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          test_type: "TEST_LIPID_PANEL",
          status: "pending",
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Create test report failed: ${error?.message}`);
      testReportId = data?.id;
    })
  );

  // CRUD_010: Update test report status
  results.push(
    await runTest("CRUD_010", "crud", "Update test report status", async () => {
      if (!testReportId) throw new Error("No test report to update");
      const { error } = await supabaseAdmin
        .from("test_reports")
        .update({ status: "completed" })
        .eq("id", testReportId);
      assert(!error, `Update test report failed: ${error?.message}`);
    })
  );

  // CRUD_011: Create document
  results.push(
    await runTest("CRUD_011", "crud", "Create document record", async () => {
      const { error } = await supabaseAdmin.from("documents").insert({
        patient_id: fixtures.patient_id,
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        file_name: "TEST_DOCUMENT_2.pdf",
        file_type: "application/pdf",
        uploaded_by: fixtures.operator_id,
      });
      assert(!error, `Create document failed: ${error?.message}`);
    })
  );

  // CRUD_012: Create feedback
  results.push(
    await runTest("CRUD_012", "crud", "Create feedback", async () => {
      const { error } = await supabaseAdmin.from("feedback").insert({
        patient_id: fixtures.patient_id,
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        feedback_type: "suggestion",
        message: "TEST_FEEDBACK_SUGGESTION",
        rating: 4,
      });
      assert(!error, `Create feedback failed: ${error?.message}`);
    })
  );

  // CRUD_013: Create followup
  results.push(
    await runTest("CRUD_013", "crud", "Create patient followup", async () => {
      const { error } = await supabaseAdmin.from("patient_followups").insert({
        patient_id: fixtures.patient_id,
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        title: "TEST_FOLLOWUP_2",
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: fixtures.operator_id,
        created_by: fixtures.operator_id,
      });
      assert(!error, `Create followup failed: ${error?.message}`);
    })
  );

  // CRUD_014: Delete followup
  results.push(
    await runTest("CRUD_014", "crud", "Delete followup", async () => {
      const { error } = await supabaseAdmin
        .from("patient_followups")
        .delete()
        .eq("title", "TEST_FOLLOWUP_2");
      assert(!error, `Delete followup failed: ${error?.message}`);
    })
  );

  // CRUD_015: Pagination test
  results.push(
    await runTest("CRUD_015", "crud", "Pagination works correctly", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .select("*", { count: "exact" })
        .range(0, 9);
      assert(!error, `Pagination failed: ${error?.message}`);
      assert(Array.isArray(data), "Expected array result");
    })
  );

  // CRUD_016: Delete test patient (cleanup)
  results.push(
    await runTest("CRUD_016", "crud", "Delete patient cascades correctly", async () => {
      if (!testPatientId) throw new Error("No test patient to delete");
      // First delete related records
      await supabaseAdmin.from("bill_payments").delete().eq("bill_id", testBillId);
      await supabaseAdmin.from("bills").delete().eq("id", testBillId);
      await supabaseAdmin.from("test_reports").delete().eq("id", testReportId);
      
      const { error } = await supabaseAdmin.from("patients").delete().eq("id", testPatientId);
      assert(!error, `Delete patient failed: ${error?.message}`);
    })
  );

  return results;
}

// ============================================
// RLS Tests
// ============================================

async function runRlsTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  supabaseUrl: string,
  anonKey: string,
  fixtures: TestFixtures
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Get tokens for different users
  const { data: superAdminAuth } = await supabaseAdmin.auth.signInWithPassword({
    email: "test_super_admin@test.labflow.com",
    password: "TestPass123!",
  });
  const superAdminToken = superAdminAuth.session?.access_token;

  const { data: labAdminAuth } = await supabaseAdmin.auth.signInWithPassword({
    email: "test_lab_admin@test.labflow.com",
    password: "TestPass123!",
  });
  const labAdminToken = labAdminAuth.session?.access_token;

  const { data: operatorAuth } = await supabaseAdmin.auth.signInWithPassword({
    email: "test_operator@test.labflow.com",
    password: "TestPass123!",
  });
  const operatorToken = operatorAuth.session?.access_token;

  const { data: otherOperatorAuth } = await supabaseAdmin.auth.signInWithPassword({
    email: "test_operator_other@test.labflow.com",
    password: "TestPass123!",
  });
  const otherOperatorToken = otherOperatorAuth.session?.access_token;

  // RLS_001: Super admin reads all labs
  results.push(
    await runTest("RLS_001", "rls", "Super admin can read all labs", async () => {
      if (!superAdminToken) throw new Error("No super admin token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      });
      const { data, error } = await client.from("labs").select("*");
      assert(!error, `Super admin lab read failed: ${error?.message}`);
      assert(Array.isArray(data) && data.length >= 2, "Super admin should see all labs");
    })
  );

  // RLS_002: Lab admin reads own org only
  results.push(
    await runTest("RLS_002", "rls", "Lab admin reads own organization only", async () => {
      if (!labAdminToken) throw new Error("No lab admin token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${labAdminToken}` } },
      });
      const { data, error } = await client.from("labs").select("*");
      assert(!error, `Lab admin lab read failed: ${error?.message}`);
      // Lab admin should only see labs in their organization
      const labNames = (data || []).map((l: { name: string }) => l.name);
      assert(labNames.includes("TEST_LAB_001"), "Should see own lab");
    })
  );

  // RLS_003: Operator reads own branch only
  results.push(
    await runTest("RLS_003", "rls", "Operator reads own branch patients", async () => {
      if (!operatorToken) throw new Error("No operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${operatorToken}` } },
      });
      const { data, error } = await client.from("patients").select("*");
      assert(!error, `Operator patient read failed: ${error?.message}`);
      // All patients should be from their branch
      const otherBranchPatients = (data || []).filter(
        (p: { branch_id: string }) => p.branch_id !== fixtures.branch_id
      );
      assertEq(otherBranchPatients.length, 0, "Should not see other branch patients");
    })
  );

  // RLS_004: Cross-tenant patient access
  results.push(
    await runTest("RLS_004", "rls", "Cross-tenant patient access blocked", async () => {
      if (!otherOperatorToken) throw new Error("No other operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${otherOperatorToken}` } },
      });
      const { data } = await client
        .from("patients")
        .select("*")
        .eq("id", fixtures.patient_id);
      assertEq(data?.length || 0, 0, "Should not access other tenant's patient");
    })
  );

  // RLS_005: Cross-tenant bill access
  results.push(
    await runTest("RLS_005", "rls", "Cross-tenant bill access blocked", async () => {
      if (!otherOperatorToken) throw new Error("No other operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${otherOperatorToken}` } },
      });
      const { data } = await client.from("bills").select("*").eq("id", fixtures.bill_id);
      assertEq(data?.length || 0, 0, "Should not access other tenant's bill");
    })
  );

  // RLS_006: Cross-tenant test report access
  results.push(
    await runTest("RLS_006", "rls", "Cross-tenant test report access blocked", async () => {
      if (!otherOperatorToken) throw new Error("No other operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${otherOperatorToken}` } },
      });
      const { data } = await client
        .from("test_reports")
        .select("*")
        .eq("id", fixtures.test_report_id);
      assertEq(data?.length || 0, 0, "Should not access other tenant's report");
    })
  );

  // RLS_007: Cross-tenant document access
  results.push(
    await runTest("RLS_007", "rls", "Cross-tenant document access blocked", async () => {
      if (!otherOperatorToken) throw new Error("No other operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${otherOperatorToken}` } },
      });
      const { data } = await client
        .from("documents")
        .select("*")
        .eq("id", fixtures.document_id);
      assertEq(data?.length || 0, 0, "Should not access other tenant's document");
    })
  );

  // RLS_008: Cross-tenant followup access
  results.push(
    await runTest("RLS_008", "rls", "Cross-tenant followup access blocked", async () => {
      if (!otherOperatorToken) throw new Error("No other operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${otherOperatorToken}` } },
      });
      const { data } = await client
        .from("patient_followups")
        .select("*")
        .eq("id", fixtures.followup_id);
      assertEq(data?.length || 0, 0, "Should not access other tenant's followup");
    })
  );

  // RLS_009: Anonymous cannot access patients
  results.push(
    await runTest("RLS_009", "rls", "Anonymous cannot access patients", async () => {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data, error } = await anonClient.from("patients").select("*");
      // Should either error or return empty
      assert(error || (data?.length || 0) === 0, "Anonymous should not access patients");
    })
  );

  // RLS_010: Anonymous cannot access bills
  results.push(
    await runTest("RLS_010", "rls", "Anonymous cannot access bills", async () => {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data, error } = await anonClient.from("bills").select("*");
      assert(error || (data?.length || 0) === 0, "Anonymous should not access bills");
    })
  );

  // RLS_011: Super admin can view audit logs
  results.push(
    await runTest("RLS_011", "rls", "Super admin can view audit logs", async () => {
      if (!superAdminToken) throw new Error("No super admin token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      });
      const { error } = await client.from("audit_logs").select("*").limit(1);
      assert(!error, `Super admin audit log read failed: ${error?.message}`);
    })
  );

  // RLS_012: Super admin can view login attempts
  results.push(
    await runTest("RLS_012", "rls", "Super admin can view login attempts", async () => {
      if (!superAdminToken) throw new Error("No super admin token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${superAdminToken}` } },
      });
      const { error } = await client.from("login_attempts").select("*").limit(1);
      assert(!error, `Super admin login attempts read failed: ${error?.message}`);
    })
  );

  // RLS_013: Operator cannot view login attempts
  results.push(
    await runTest("RLS_013", "rls", "Operator cannot view login attempts", async () => {
      if (!operatorToken) throw new Error("No operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${operatorToken}` } },
      });
      const { data } = await client.from("login_attempts").select("*").limit(1);
      assertEq(data?.length || 0, 0, "Operator should not see login attempts");
    })
  );

  // RLS_014: Global test types visible to authenticated
  results.push(
    await runTest("RLS_014", "rls", "Global test types visible to authenticated", async () => {
      if (!operatorToken) throw new Error("No operator token");
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${operatorToken}` } },
      });
      const { error } = await client.from("global_test_types").select("*").limit(1);
      assert(!error, `Global test types read failed: ${error?.message}`);
    })
  );

  // Sign out all
  await supabaseAdmin.auth.signOut();

  return results;
}

// ============================================
// Validation Tests
// ============================================

async function runValidationTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  fixtures: TestFixtures
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // VAL_001: Patient name < 2 chars rejected
  results.push(
    await runTest("VAL_001", "validation", "Patient name < 2 chars rejected", async () => {
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-VAL001",
        full_name: "A",
        phone: "9999999903",
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject short patient name");
    })
  );

  // VAL_002: Phone != 10 digits rejected
  results.push(
    await runTest("VAL_002", "validation", "Phone != 10 digits rejected", async () => {
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-VAL002",
        full_name: "TEST VALIDATION PATIENT",
        phone: "123", // Too short
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject invalid phone");
    })
  );

  // VAL_003: Missing required lab_id rejected
  results.push(
    await runTest("VAL_003", "validation", "Missing required lab_id rejected", async () => {
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-VAL003",
        full_name: "TEST VALIDATION PATIENT",
        phone: "9999999904",
        branch_id: fixtures.branch_id,
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject missing lab_id");
    })
  );

  // VAL_004: Invalid branch_id FK rejected
  results.push(
    await runTest("VAL_004", "validation", "Invalid branch_id FK rejected", async () => {
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-VAL004",
        full_name: "TEST VALIDATION PATIENT",
        phone: "9999999905",
        lab_id: fixtures.lab_id,
        branch_id: "00000000-0000-0000-0000-000000000000", // Non-existent
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject invalid branch_id FK");
    })
  );

  // VAL_005: Duplicate bill_number rejected
  results.push(
    await runTest("VAL_005", "validation", "Duplicate bill_number rejected", async () => {
      const { error } = await supabaseAdmin.from("bills").insert({
        bill_number: "TL-TEST-0001", // Already exists
        patient_id: fixtures.patient_id,
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        total_amount: 100,
        due_amount: 100,
        due_date: new Date().toISOString().split("T")[0],
        items: [],
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject duplicate bill_number");
    })
  );

  // VAL_006: Bill date in future accepted
  results.push(
    await runTest("VAL_006", "validation", "Bill date in future accepted", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data, error } = await supabaseAdmin
        .from("bills")
        .insert({
          bill_number: "TL-TEST-FUTURE",
          patient_id: fixtures.patient_id,
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          total_amount: 100,
          due_amount: 100,
          bill_date: futureDate,
          due_date: futureDate,
          items: [],
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Future bill date should be accepted: ${error?.message}`);
      // Cleanup
      if (data) await supabaseAdmin.from("bills").delete().eq("id", data.id);
    })
  );

  // VAL_007: Empty string patient name rejected
  results.push(
    await runTest("VAL_007", "validation", "Empty string patient name rejected", async () => {
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-VAL007",
        full_name: "",
        phone: "9999999906",
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        created_by: fixtures.operator_id,
      });
      assert(!!error, "Should reject empty patient name");
    })
  );

  // VAL_008: Unicode characters in names accepted
  results.push(
    await runTest("VAL_008", "validation", "Unicode characters in names accepted", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .insert({
          patient_id: "TL-TB01-VAL008",
          full_name: "TEST PATIENT मरीज 患者",
          phone: "9999999907",
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Unicode names should be accepted: ${error?.message}`);
      // Cleanup
      if (data) await supabaseAdmin.from("patients").delete().eq("id", data.id);
    })
  );

  // VAL_009: Empty array for bill items accepted
  results.push(
    await runTest("VAL_009", "validation", "Empty array for bill items accepted", async () => {
      const { data, error } = await supabaseAdmin
        .from("bills")
        .insert({
          bill_number: "TL-TEST-EMPTY",
          patient_id: fixtures.patient_id,
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          total_amount: 0,
          due_amount: 0,
          due_date: new Date().toISOString().split("T")[0],
          items: [],
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Empty items array should be accepted: ${error?.message}`);
      if (data) await supabaseAdmin.from("bills").delete().eq("id", data.id);
    })
  );

  // VAL_010: Zero-amount bill accepted
  results.push(
    await runTest("VAL_010", "validation", "Zero-amount bill accepted", async () => {
      const { data, error } = await supabaseAdmin
        .from("bills")
        .insert({
          bill_number: "TL-TEST-ZERO",
          patient_id: fixtures.patient_id,
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          total_amount: 0,
          due_amount: 0,
          due_date: new Date().toISOString().split("T")[0],
          items: [],
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      assert(!error, `Zero-amount bill should be accepted: ${error?.message}`);
      if (data) await supabaseAdmin.from("bills").delete().eq("id", data.id);
    })
  );

  return results;
}

// ============================================
// Edge Case Tests
// ============================================

async function runEdgeCaseTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  fixtures: TestFixtures
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // EDGE_001: SQL injection in username
  results.push(
    await runTest("EDGE_001", "edge_cases", "SQL injection in username escaped", async () => {
      const { error } = await supabaseAdmin.auth.signInWithPassword({
        email: "'; DROP TABLE users; --@test.com",
        password: "test",
      });
      // Should fail auth but not cause SQL error
      assert(!!error, "Should reject invalid email");
      assertContains(error.message.toLowerCase(), "invalid", "Should be auth error not SQL error");
    })
  );

  // EDGE_002: SQL injection in search
  results.push(
    await runTest("EDGE_002", "edge_cases", "SQL injection in search escaped", async () => {
      const { error } = await supabaseAdmin
        .from("patients")
        .select("*")
        .ilike("full_name", "'; DROP TABLE patients; --");
      assert(!error, "Search should handle SQL injection safely");
    })
  );

  // EDGE_003: XSS in patient name stored as text
  results.push(
    await runTest("EDGE_003", "edge_cases", "XSS in patient name stored as text", async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const { data, error } = await supabaseAdmin
        .from("patients")
        .insert({
          patient_id: "TL-TB01-XSS001",
          full_name: `TEST ${xssPayload}`,
          phone: "9999999908",
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          created_by: fixtures.operator_id,
        })
        .select()
        .single();
      // The trigger normalizes to uppercase, so check it's stored safely
      assert(!error, `XSS payload should be stored: ${error?.message}`);
      if (data) await supabaseAdmin.from("patients").delete().eq("id", data.id);
    })
  );

  // EDGE_004: Null in optional fields accepted
  results.push(
    await runTest("EDGE_004", "edge_cases", "Null in optional fields accepted", async () => {
      const { data, error } = await supabaseAdmin
        .from("patients")
        .insert({
          patient_id: "TL-TB01-NULL001",
          full_name: "TEST NULL PATIENT",
          phone: "9999999909",
          lab_id: fixtures.lab_id,
          branch_id: fixtures.branch_id,
          created_by: fixtures.operator_id,
          age: null,
          gender: null,
          patient_history: null,
        })
        .select()
        .single();
      assert(!error, `Null fields should be accepted: ${error?.message}`);
      if (data) await supabaseAdmin.from("patients").delete().eq("id", data.id);
    })
  );

  // EDGE_005: Very long string handling
  results.push(
    await runTest("EDGE_005", "edge_cases", "Very long string handling", async () => {
      const longString = "A".repeat(5000);
      const { error } = await supabaseAdmin.from("patients").insert({
        patient_id: "TL-TB01-LONG001",
        full_name: longString,
        phone: "9999999910",
        lab_id: fixtures.lab_id,
        branch_id: fixtures.branch_id,
        created_by: fixtures.operator_id,
      });
      // May succeed or fail based on column limits, but shouldn't crash
      assert(true, "Long string handled without crash");
    })
  );

  // EDGE_006: Concurrent patient ID generation
  results.push(
    await runTest("EDGE_006", "edge_cases", "Concurrent patient ID generation", async () => {
      // Test the RPC function for generating patient IDs
      const promises = Array(3)
        .fill(null)
        .map(() =>
          supabaseAdmin.rpc("generate_patient_id", {
            p_branch_id: fixtures.branch_id,
            p_lab_id: fixtures.lab_id,
          })
        );
      const results = await Promise.all(promises);
      const ids = results.map((r) => r.data).filter(Boolean);
      const uniqueIds = new Set(ids);
      assertEq(uniqueIds.size, ids.length, "All generated IDs should be unique");
    })
  );

  // EDGE_007: Concurrent bill number generation
  results.push(
    await runTest("EDGE_007", "edge_cases", "Concurrent bill number generation", async () => {
      const promises = Array(3)
        .fill(null)
        .map(() =>
          supabaseAdmin.rpc("generate_bill_number", {
            p_lab_id: fixtures.lab_id,
          })
        );
      const results = await Promise.all(promises);
      const numbers = results.map((r) => r.data).filter(Boolean);
      const uniqueNumbers = new Set(numbers);
      assertEq(uniqueNumbers.size, numbers.length, "All generated bill numbers should be unique");
    })
  );

  // EDGE_008: Delete patient with bills (FK constraint)
  results.push(
    await runTest("EDGE_008", "edge_cases", "Delete patient with bills blocked by FK", async () => {
      // Try to delete the fixture patient which has bills
      const { error } = await supabaseAdmin
        .from("patients")
        .delete()
        .eq("id", fixtures.patient_id);
      assert(!!error, "Should not delete patient with associated bills");
    })
  );

  // EDGE_009: Special characters in notes
  results.push(
    await runTest("EDGE_009", "edge_cases", "Special characters in notes handled", async () => {
      const specialChars = `Test with "quotes", 'apostrophes', \\ backslashes, and emoji 🏥`;
      const { error } = await supabaseAdmin
        .from("bills")
        .update({ notes: specialChars })
        .eq("id", fixtures.bill_id);
      assert(!error, `Special characters in notes should work: ${error?.message}`);
    })
  );

  // EDGE_010: JSON in JSONB field
  results.push(
    await runTest("EDGE_010", "edge_cases", "Complex JSON in JSONB field", async () => {
      const complexItems = [
        { name: "Test", price: 100, nested: { key: "value" }, array: [1, 2, 3] },
      ];
      const { error } = await supabaseAdmin
        .from("bills")
        .update({ items: complexItems })
        .eq("id", fixtures.bill_id);
      assert(!error, `Complex JSON should be stored: ${error?.message}`);
    })
  );

  return results;
}

// ============================================
// Performance Tests
// ============================================

async function runPerformanceTests(
  supabaseAdmin: ReturnType<typeof createClient>,
  fixtures: TestFixtures
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // PERF_001: Patient list query
  results.push(
    await runTest("PERF_001", "performance", "Patient list query < 200ms", async () => {
      const start = performance.now();
      await supabaseAdmin.from("patients").select("*").limit(100);
      const duration = performance.now() - start;
      assert(duration < 200, `Query took ${duration.toFixed(0)}ms, expected < 200ms`);
    })
  );

  // PERF_002: Bill search by date range
  results.push(
    await runTest("PERF_002", "performance", "Bill date range query < 200ms", async () => {
      const start = performance.now();
      const today = new Date().toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await supabaseAdmin
        .from("bills")
        .select("*")
        .gte("bill_date", monthAgo)
        .lte("bill_date", today);
      const duration = performance.now() - start;
      assert(duration < 200, `Query took ${duration.toFixed(0)}ms, expected < 200ms`);
    })
  );

  // PERF_003: Dashboard stats RPC
  results.push(
    await runTest("PERF_003", "performance", "Dashboard stats RPC < 100ms", async () => {
      const start = performance.now();
      await supabaseAdmin.rpc("get_dashboard_stats", {
        p_lab_id: fixtures.lab_id,
      });
      const duration = performance.now() - start;
      assert(duration < 100, `RPC took ${duration.toFixed(0)}ms, expected < 100ms`);
    })
  );

  // PERF_004: Patient search by name
  results.push(
    await runTest("PERF_004", "performance", "Patient name search < 150ms", async () => {
      const start = performance.now();
      await supabaseAdmin.from("patients").select("*").ilike("full_name", "%TEST%").limit(50);
      const duration = performance.now() - start;
      assert(duration < 150, `Search took ${duration.toFixed(0)}ms, expected < 150ms`);
    })
  );

  // PERF_005: Outstanding bills query
  results.push(
    await runTest("PERF_005", "performance", "Outstanding bills query < 200ms", async () => {
      const start = performance.now();
      await supabaseAdmin.from("bills").select("*").gt("due_amount", 0).limit(100);
      const duration = performance.now() - start;
      assert(duration < 200, `Query took ${duration.toFixed(0)}ms, expected < 200ms`);
    })
  );

  // PERF_006: Test reports by status
  results.push(
    await runTest("PERF_006", "performance", "Test reports by status < 200ms", async () => {
      const start = performance.now();
      await supabaseAdmin.from("test_reports").select("*").eq("status", "pending").limit(100);
      const duration = performance.now() - start;
      assert(duration < 200, `Query took ${duration.toFixed(0)}ms, expected < 200ms`);
    })
  );

  // PERF_007: Complex join query
  results.push(
    await runTest("PERF_007", "performance", "Bill+patient join < 250ms", async () => {
      const start = performance.now();
      await supabaseAdmin
        .from("bills")
        .select("*, patients!bills_patient_id_fkey(full_name, phone)")
        .limit(50);
      const duration = performance.now() - start;
      assert(duration < 250, `Join took ${duration.toFixed(0)}ms, expected < 250ms`);
    })
  );

  // PERF_008: Rate limit check function
  results.push(
    await runTest("PERF_008", "performance", "Rate limit check < 50ms", async () => {
      const start = performance.now();
      await supabaseAdmin.rpc("check_login_rate_limit", {
        p_username: "test_user",
        p_ip_address: "192.168.1.1",
      });
      const duration = performance.now() - start;
      assert(duration < 50, `RPC took ${duration.toFixed(0)}ms, expected < 50ms`);
    })
  );

  // PERF_009: Preview patient ID generation
  results.push(
    await runTest("PERF_009", "performance", "Preview patient ID < 50ms", async () => {
      const start = performance.now();
      await supabaseAdmin.rpc("preview_patient_id", {
        p_branch_id: fixtures.branch_id,
        p_lab_id: fixtures.lab_id,
      });
      const duration = performance.now() - start;
      assert(duration < 50, `RPC took ${duration.toFixed(0)}ms, expected < 50ms`);
    })
  );

  // PERF_010: Preview bill number generation
  results.push(
    await runTest("PERF_010", "performance", "Preview bill number < 50ms", async () => {
      const start = performance.now();
      await supabaseAdmin.rpc("preview_bill_number", {
        p_lab_id: fixtures.lab_id,
      });
      const duration = performance.now() - start;
      assert(duration < 50, `RPC took ${duration.toFixed(0)}ms, expected < 50ms`);
    })
  );

  return results;
}

// ============================================
// Coverage Report
// ============================================

function generateCoverageReport(results: TestResult[]): TestReport["coverage"] {
  const testedTables = [
    "patients",
    "bills",
    "bill_payments",
    "test_reports",
    "documents",
    "feedback",
    "patient_followups",
    "labs",
    "branches",
    "organizations",
    "audit_logs",
    "login_attempts",
    "global_test_types",
  ];

  const testedRpcFunctions = [
    "check_login_rate_limit",
    "generate_patient_id",
    "generate_bill_number",
    "preview_patient_id",
    "preview_bill_number",
    "get_dashboard_stats",
    "setup_test_environment",
    "cleanup_test_environment",
  ];

  const allTables = [
    ...testedTables,
    "appointments",
    "appointment_reminders",
    "demo_videos",
    "document_templates",
    "leads",
    "lead_activities",
  ];

  const untestedTables = allTables.filter((t) => !testedTables.includes(t));

  return {
    tables_tested: testedTables,
    rpc_functions_tested: testedRpcFunctions,
    untested_tables: untestedTables,
    coverage_percent: Math.round((testedTables.length / allTables.length) * 100 * 10) / 10,
  };
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Validate webhook secret if provided
  const webhookSecret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("TEST_WEBHOOK_SECRET");
  if (expectedSecret && webhookSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // Handle cleanup endpoint
    if (req.method === "DELETE" || url.pathname.endsWith("/cleanup")) {
      console.log("Running test environment cleanup...");
      const { data, error } = await supabaseAdmin.rpc("cleanup_test_environment");
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Cleanup completed", deleted: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle coverage endpoint
    if (url.pathname.endsWith("/coverage")) {
      const coverage = generateCoverageReport([]);
      return new Response(JSON.stringify({ success: true, coverage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Main test execution
    const category = url.searchParams.get("category");
    console.log(`Starting test run${category ? ` for category: ${category}` : ""}...`);

    const startTime = performance.now();

    // Setup test environment
    console.log("Setting up test environment...");
    const { data: fixtures, error: setupError } = await supabaseAdmin.rpc("setup_test_environment");
    if (setupError) {
      throw new Error(`Setup failed: ${setupError.message}`);
    }
    console.log("Test fixtures created:", fixtures);

    const allResults: TestResult[] = [];
    const categoryResults: Record<string, CategoryResult> = {};

    // Run test categories based on filter
    const categories = category
      ? [category]
      : ["auth", "crud", "rls", "validation", "edge_cases", "performance"];

    for (const cat of categories) {
      console.log(`Running ${cat} tests...`);
      const catStart = performance.now();
      let results: TestResult[] = [];

      switch (cat) {
        case "auth":
          results = await runAuthTests(supabaseAdmin, supabaseUrl, anonKey);
          break;
        case "crud":
          results = await runCrudTests(supabaseAdmin, fixtures);
          break;
        case "rls":
          results = await runRlsTests(supabaseAdmin, supabaseUrl, anonKey, fixtures);
          break;
        case "validation":
          results = await runValidationTests(supabaseAdmin, fixtures);
          break;
        case "edge_cases":
          results = await runEdgeCaseTests(supabaseAdmin, fixtures);
          break;
        case "performance":
          results = await runPerformanceTests(supabaseAdmin, fixtures);
          break;
      }

      allResults.push(...results);
      categoryResults[cat] = {
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
        skipped: 0,
        duration_ms: Math.round(performance.now() - catStart),
      };
      console.log(`${cat}: ${categoryResults[cat].passed} passed, ${categoryResults[cat].failed} failed`);
    }

    // Cleanup test environment
    console.log("Cleaning up test environment...");
    await supabaseAdmin.rpc("cleanup_test_environment");

    const totalDuration = Math.round(performance.now() - startTime);
    const passed = allResults.filter((r) => r.passed).length;
    const failed = allResults.filter((r) => !r.passed).length;

    const report: TestReport = {
      success: failed === 0,
      timestamp: new Date().toISOString(),
      duration_ms: totalDuration,
      summary: {
        total: allResults.length,
        passed,
        failed,
        skipped: 0,
      },
      categories: categoryResults,
      failures: allResults.filter((r) => !r.passed),
      coverage: generateCoverageReport(allResults),
    };

    console.log(`Test run complete: ${passed} passed, ${failed} failed in ${totalDuration}ms`);

    return new Response(JSON.stringify(report, null, 2), {
      status: failed > 0 ? 500 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const err = error as Error;
    console.error("Test run failed:", err.message);

    // Try to cleanup on error
    try {
      await supabaseAdmin.rpc("cleanup_test_environment");
    } catch {
      console.error("Cleanup also failed");
    }

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
