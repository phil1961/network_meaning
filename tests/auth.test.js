/* ─────────────────────────────────────────────
   File: tests/auth.test.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Passwords, emails and the sign-up setting. No database: the parts of
   auth.js that need one are covered in db.test.js. */
import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, normEmail, validEmail, validPassword, signupMode, signupCodeMatches, login } from "../src/server/auth.js";

test("a password is stored as a salted scrypt hash that only the same password opens", async () => {
  const a = await hashPassword("correct horse battery"), b = await hashPassword("correct horse battery");
  assert.match(a, /^scrypt\$16384\$8\$1\$[\w-]+\$[\w-]+$/);
  assert.notEqual(a, b, "a fresh salt each time");
  assert.ok(!a.includes("correct horse"));
  assert.equal(await verifyPassword("correct horse battery", a), true);
  assert.equal(await verifyPassword("correct horse batterz", a), false);
  assert.equal(await verifyPassword("", a), false);
  for (const junk of ["", null, "plain", "scrypt$x", "scrypt$1$1$1$AA$AA", "bcrypt$1$2$3$4$5"]) assert.equal(await verifyPassword("x", junk), false, String(junk));
});

test("email is trimmed and lower-cased, and has to look like one", () => {
  assert.equal(normEmail("  Phil@Example.COM "), "phil@example.com");
  assert.equal(normEmail(null), "");
  for (const ok of ["a@b.co", "first.last+tag@sub.example.org"]) assert.equal(validEmail(ok), true, ok);
  for (const bad of ["", "nope", "a@b", "a b@c.de", "@c.de", "a@", "x".repeat(250) + "@b.co"]) assert.equal(validEmail(bad), false, bad);
  assert.equal(validPassword("1234567"), false);
  assert.equal(validPassword("12345678"), true);
  assert.equal(validPassword("x".repeat(201)), false);
  assert.equal(validPassword(12345678), false);
});

test("who may sign up is set in the environment: open, by invite code, or closed", () => {
  const keep = { SIGNUP: process.env.SIGNUP, SIGNUP_CODE: process.env.SIGNUP_CODE };
  delete process.env.SIGNUP; delete process.env.SIGNUP_CODE;
  assert.equal(signupMode(), "open");
  assert.equal(signupCodeMatches("anything"), false, "no code set, no code matches");
  process.env.SIGNUP_CODE = "bobby-milk";
  assert.equal(signupMode(), "code");
  assert.equal(signupCodeMatches(" bobby-milk "), true);
  assert.equal(signupCodeMatches("bobby-milX"), false);
  process.env.SIGNUP = "Closed";
  assert.equal(signupMode(), "closed", "closed wins over a code");
  for (const k of Object.keys(keep)) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; }
});

test("with no database, a wrong password is refused instead of failing", async () => {
  const keep = { DATABASE_URL: process.env.DATABASE_URL, APP_PASSWORD: process.env.APP_PASSWORD };
  delete process.env.DATABASE_URL; process.env.APP_PASSWORD = "correct horse";
  assert.equal(await login("", "nope"), null);
  assert.equal(await login("someone@example.com", "correct horse"), null, "the owner's password opens only the owner's account");
  for (const k of Object.keys(keep)) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; }
});
