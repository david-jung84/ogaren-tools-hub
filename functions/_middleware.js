/**
 * 오가렌 도구 인증허브 — 접근 게이트 (Cloudflare Pages Functions)
 *
 * 모든 요청을 가로채서, 유효한 세션 쿠키가 없으면 비밀번호 로그인 페이지를 보여준다.
 * 비밀번호가 맞으면 HMAC 서명된 세션 쿠키를 발급한다.
 *   → 서버단(엣지)에서 강제하므로 클라이언트 우회 불가. (StatiCrypt 같은 클라 암호화보다 강함)
 *
 * ★ Cloudflare Pages 환경변수 — 대시보드(Settings > Environment variables)에서 설정.
 *   repo 에는 절대 커밋하지 말 것:
 *     SITE_PASSWORD : 공용 접속 비밀번호
 *     AUTH_SECRET   : 쿠키 서명용 무작위 문자열 (32자 이상 권장)
 *
 * 특수 경로:
 *     POST /__auth   : 로그인 폼 제출 처리
 *     GET  /__logout : 로그아웃(쿠키 삭제)
 */

const COOKIE_NAME = "ogaren_auth";
const SESSION_DAYS = 30; // 로그인 유지 기간(일)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 환경변수 미설정 시 안전하게 차단(fail-closed)
  if (!env.SITE_PASSWORD || !env.AUTH_SECRET) {
    return new Response(
      "설정 오류: Cloudflare Pages 대시보드에 SITE_PASSWORD / AUTH_SECRET 환경변수를 등록하세요.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  // 로그아웃
  if (url.pathname === "/__logout") {
    return redirect("/", clearCookie());
  }

  // 로그인 처리 (폼 POST)
  if (url.pathname === "/__auth" && request.method === "POST") {
    const form = await request.formData();
    const pw = String(form.get("password") || "");
    const dest = safeNext(form.get("next"));
    if (timingSafeEqual(pw, env.SITE_PASSWORD)) {
      const token = await makeToken(env.AUTH_SECRET);
      return redirect(dest, sessionCookie(token));
    }
    return loginPage(dest, "비밀번호가 올바르지 않습니다.", 401);
  }

  // 유효한 세션 쿠키가 있으면 통과 → 정적 파일 서빙
  const token = getCookie(request, COOKIE_NAME);
  if (token && (await verifyToken(env.AUTH_SECRET, token))) {
    return context.next();
  }

  // 그 외에는 로그인 페이지(원래 가려던 경로를 next 로 보존)
  return loginPage(url.pathname + url.search, null, 200);
}

/* ───────────────────────── 응답/쿠키 헬퍼 ───────────────────────── */

function redirect(location, setCookie) {
  const headers = { location };
  if (setCookie) headers["set-cookie"] = setCookie;
  return new Response(null, { status: 302, headers });
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

// 오픈 리다이렉트 방지: 같은 사이트 내부 경로만 허용
function safeNext(v) {
  const s = String(v || "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

/* ───────────────────────── 토큰(HMAC 서명) ───────────────────────── */

async function makeToken(secret) {
  const exp = Date.now() + SESSION_DAYS * 86400 * 1000;
  const sig = await hmacHex(secret, String(exp));
  return `${exp}.${sig}`;
}

async function verifyToken(secret, token) {
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const exp = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!/^\d+$/.test(exp)) return false; // 형식 검증
  if (Number(exp) < Date.now()) return false; // 만료 검증
  const expected = await hmacHex(secret, exp);
  return timingSafeEqual(sig, expected); // 위조 검증
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 타이밍 공격 완화용 상수시간 비교
function timingSafeEqual(a, b) {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/* ───────────────────────── 로그인 페이지 ───────────────────────── */

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function loginPage(dest, error, status) {
  const errHtml = error
    ? `<p class="err">${esc(error)}</p>`
    : "";
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>오가렌 도구 인증허브 · 로그인</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: "Malgun Gothic", "맑은 고딕", -apple-system, system-ui, sans-serif;
    background: linear-gradient(135deg, #1F4E79 0%, #163a5c 100%); color: #1f2937;
  }
  .card {
    width: 100%; max-width: 360px; margin: 20px; background: #fff; border-radius: 16px;
    padding: 36px 30px; box-shadow: 0 20px 50px rgba(0,0,0,.25); text-align: center;
  }
  .lock { font-size: 40px; line-height: 1; margin-bottom: 14px; }
  h1 { font-size: 19px; margin: 0 0 6px; color: #1F4E79; }
  .sub { font-size: 13px; color: #6b7280; margin: 0 0 22px; }
  input[type=password] {
    width: 100%; padding: 13px 14px; font-size: 15px; border: 1.5px solid #d1d5db;
    border-radius: 10px; outline: none; transition: border-color .15s;
  }
  input[type=password]:focus { border-color: #1F4E79; }
  button {
    width: 100%; margin-top: 12px; padding: 13px; font-size: 15px; font-weight: 600;
    color: #fff; background: #1F4E79; border: 0; border-radius: 10px; cursor: pointer;
    transition: background .15s;
  }
  button:hover { background: #163a5c; }
  .err { color: #dc2626; font-size: 13px; margin: 14px 0 0; }
  .foot { margin-top: 22px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
  <form class="card" method="POST" action="/__auth">
    <div class="lock">🔒</div>
    <h1>오가렌 도구 인증허브</h1>
    <p class="sub">사내 전용입니다. 접속 비밀번호를 입력하세요.</p>
    <input type="password" name="password" placeholder="비밀번호" autofocus autocomplete="current-password" required>
    <input type="hidden" name="next" value="${esc(dest)}">
    <button type="submit">입장</button>
    ${errHtml}
    <p class="foot">오가렌 DX팀</p>
  </form>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
