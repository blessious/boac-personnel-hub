import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import os from "node:os";
import { securityTestMode } from "../security-test-mode.mjs";

const valid = {
  NODE_ENV: "test",
  HRIS_SECURITY_TEST: "1",
  HRIS_DB_NAME: "hris_security_0123456789abcdef01234567",
  HRIS_DB_HOST: "127.0.0.1",
  HRIS_DB_PORT: "47312",
  HRIS_DB_USER: "test",
  HRIS_DB_PASSWORD: "",
  HRIS_API_PORT: "47314",
  HRIS_ADMS_PORT: "0",
  HRIS_RUNTIME_DIR: path.join(os.tmpdir(), "hris-security-fixture"),
};

test("security mode is opt-in and accepts explicit isolated settings", () => {
  assert.equal(securityTestMode({}), false);
  assert.equal(securityTestMode(valid), true);
});

test("unsafe isolation settings fail before server initialization", () => {
  for (const [key, value] of [
    ["NODE_ENV", "production"],
    ["HRIS_DB_NAME", "hris"],
    ["HRIS_DB_HOST", "192.0.2.1"],
    ["HRIS_DB_PORT", ""],
    ["HRIS_DB_PORT", "NaN"],
    ["HRIS_DB_PORT", "65536"],
    ["HRIS_DB_USER", ""],
    ["HRIS_DB_PASSWORD", undefined],
    ["HRIS_API_PORT", "47102"],
    ["HRIS_API_PORT", "0"],
    ["HRIS_API_PORT", "abc"],
    ["HRIS_ADMS_PORT", "8080"],
    ["HRIS_RUNTIME_DIR", process.cwd()],
    ["HRIS_RUNTIME_DIR", path.join(os.tmpdir(), "unrelated")],
  ])
    assert.throws(() => securityTestMode({ ...valid, [key]: value }), /Unsafe security-test/, key);
});
