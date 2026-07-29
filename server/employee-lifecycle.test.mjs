import assert from "node:assert/strict";
import test from "node:test";

import { employeeLifecycleTransition } from "./employee-lifecycle.mjs";

test("Inactive to Active reactivates the employee lifecycle and linked account", () => {
  assert.deepEqual(employeeLifecycleTransition("Inactive", "Active"), {
    lifecycleState: "Active",
    accountActive: 1,
  });
});

test("Active to Inactive disables the employee lifecycle and linked account", () => {
  assert.deepEqual(employeeLifecycleTransition("Active", "Inactive"), {
    lifecycleState: "Inactive",
    accountActive: 0,
  });
});

test("unchanged status does not synchronize the linked account", () => {
  assert.equal(employeeLifecycleTransition("Active", "Active"), null);
  assert.equal(employeeLifecycleTransition("Inactive", "Inactive"), null);
});

test("unrelated lifecycle states do not synchronize the linked account", () => {
  assert.equal(employeeLifecycleTransition("Personal Record", "Active"), null);
  assert.equal(employeeLifecycleTransition("Pre-Employment", "Inactive"), null);
});
