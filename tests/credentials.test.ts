import { test } from "node:test";
import assert from "node:assert/strict";
import { loginCredentials, registrationCredentials } from "../src/lib/credentials";

const valid = { name: " Анна ", username: "Forest_42", usernameConfirm: "forest_42", password: "StrongPassword2026", passwordConfirm: "StrongPassword2026" };
test("Registration normalizes username and name; email is unnecessary", () => {
  const result = registrationCredentials.parse(valid);
  assert.equal(result.username, "forest_42");
  assert.equal(result.name, "Анна");
  assert.equal(loginCredentials.parse({ username: "FOREST_42", password: valid.password }).username, "forest_42");
});
test("Registration rejects mismatches and non-Latin usernames", () => {
  for (const change of [{ usernameConfirm: "other_user" }, { passwordConfirm: "different" }, { username: "лесник" }, { name: "   " }]) {
    assert.equal(registrationCredentials.safeParse({ ...valid, ...change }).success, false);
  }
});
test("Password byte limit prevents bcrypt truncation", () => {
  const password = "я".repeat(37);
  assert.equal(registrationCredentials.safeParse({ ...valid, password, passwordConfirm: password }).success, false);
});
