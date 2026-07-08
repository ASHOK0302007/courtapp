/**
 * Load test for the document upload path: Storage upload + metadata POST
 * to /api/documents/upload — the most write- and bandwidth-heavy endpoint
 * in the app, and the one most exposed to a malicious or buggy client
 * (a citizen's own browser).
 *
 * WARNING: this hits real database inserts (not real Storage files). Run
 * it against a disposable test project or a throwaway case only — it will
 * leave a large number of document rows with fake storage paths behind.
 *
 * Usage:
 *   1. Install k6: https://k6.io/docs/get-started/installation/
 *   2. Get a citizen session's Supabase access token (sign in via the app,
 *      copy `sb-access-token` from devtools, or script a sign-in call) and
 *      a real case id that account owns.
 *   3. Run:
 *        BASE_URL=https://your-app.vercel.app \
 *        ACCESS_TOKEN=<citizen jwt> \
 *        CASE_ID=<uuid> \
 *        k6 run supabase/tests/load-test-uploads.js
 *
 * This only exercises the metadata endpoint (`/api/documents/upload`),
 * not the Storage upload itself — Storage is Supabase's managed
 * infrastructure and out of scope for this app's own load testing, but
 * the same access token also lets you extend this script to PUT test
 * files directly to the Storage REST endpoint if you want end-to-end
 * numbers.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN;
const CASE_ID = __ENV.CASE_ID;

export const options = {
  scenarios: {
    steady_state: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 }, // ramp to 20 concurrent uploaders
        { duration: "1m", target: 20 }, // hold
        { duration: "20s", target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800"], // 95% of requests under 800ms
    http_req_failed: ["rate<0.01"], // less than 1% errors
  },
};

export default function () {
  if (!ACCESS_TOKEN || !CASE_ID) {
    throw new Error("Set ACCESS_TOKEN and CASE_ID environment variables before running.");
  }

  const payload = JSON.stringify({
    storagePath: `${CASE_ID}/load-test-${__VU}-${__ITER}.pdf`,
    caseId: CASE_ID,
    documentType: "evidence",
    fileName: `load-test-${__VU}-${__ITER}.pdf`,
    fileSizeBytes: 102400,
    mimeType: "application/pdf",
  });

  const res = http.post(`${BASE_URL}/api/documents/upload`, payload, {
    headers: {
      "Content-Type": "application/json",
      Cookie: `sb-access-token=${ACCESS_TOKEN}`,
    },
  });

  check(res, {
    "status is 201 or 429 (rate limited, not crashed)": (r) => r.status === 201 || r.status === 429,
  });

  sleep(1);
}
