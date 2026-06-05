# 도구 인증허브 — 비밀번호 접근 게이트 설정

GitHub Pages → **Cloudflare Pages**로 옮기고, 엣지(`functions/_middleware.js`)에서 공용 비밀번호로 막는다.
서버단에서 강제하므로 **링크만 알아도 비번 없이는 못 들어온다.** 비용 0 (무료 플랜).

---

## 0. 보호 범위 (먼저 이해)

- ✅ 이 repo(`ogaren-tools-hub`) = 허브 + 그 안의 도구(`tools/ecount-code-lookup`, `tools/mattress-finder`) → **한 번에 보호됨.**
- ⚠️ **다른 repo로 분리된 도구는 따로 막아야 함** — `ogaren-sales-guide`, `ogaren-bed-install-guide`는 별도 사이트라 이 게이트가 적용 안 됨. (맨 아래 "다른 도구도 막기" 참고)

---

## 1. Cloudflare 무료 계정

[dash.cloudflare.com](https://dash.cloudflare.com) 가입 (무료, 카드 불필요).

## 2. Pages 프로젝트 생성 (GitHub 연결)

1. 좌측 **Workers & Pages → Create → Pages → Connect to Git**
2. `david-jung84/ogaren-tools-hub` 선택
3. 빌드 설정 (정적이라 빌드 없음):
   - **Framework preset**: `None`
   - **Build command**: (비움)
   - **Build output directory**: `/`
   - **Production branch**: `main`
4. **Save and Deploy** → `ogaren-tools-hub.pages.dev` 주소 생성

## 3. 비밀번호 환경변수 등록 ★ 핵심

프로젝트 → **Settings → Environment variables → Production** 에 2개 추가:

| 이름 | 값 | 비고 |
|---|---|---|
| `SITE_PASSWORD` | 원하는 공용 비밀번호 | **Encrypt** 눌러 시크릿 처리 권장 |
| `AUTH_SECRET` | 길고 무작위인 문자열(32자+) | 쿠키 위조 방지용. 아래로 생성 |

`AUTH_SECRET` 생성 (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
```

> 환경변수는 코드에 안 들어간다 → repo가 공개돼도 비번은 안 샌다.

## 4. 게이트 코드 푸시

이 폴더에 이미 추가됨: `functions/_middleware.js` (+ 이 가이드, `.gitignore` 갱신).
```powershell
git add functions/_middleware.js .gitignore CLOUDFLARE_SETUP.md
git commit -m "feat: Cloudflare Pages 비밀번호 접근 게이트 추가"
git push
```
푸시하면 Cloudflare가 자동 재배포 → 게이트 활성화.
(2~3에서 프로젝트/환경변수를 먼저 만들고 push하면 다음 배포부터 적용. push가 먼저여도 무방.)

> 3에서 환경변수를 나중에 넣었다면 **Deployments → 최신 배포 → Retry deployment** 로 한 번 재배포해야 반영됨.

## 5. 동작 확인

- `https://ogaren-tools-hub.pages.dev` 접속 → 🔒 비밀번호 페이지가 뜨면 성공
- 비번 입력 → 허브 진입 (30일 유지)
- 로그아웃: `…pages.dev/__logout`

## 6. 기존 GitHub Pages 닫기 ★ 이거 안 하면 무용지물

옛 주소 `david-jung84.github.io/ogaren-tools-hub/` 가 **비번 없이 그대로 열린다.** 반드시:

1. GitHub repo → **Settings → Pages → Source = `None`** (게시 중단)
2. 배지/북마크/문서의 링크를 새 `pages.dev` 주소로 교체
   - 특히 **이카운트 품목코드 조회**의 공식 URL이 바뀜 → 배지 주입 스크립트/안내 갱신 필요

## 7. 비밀번호 교체 / 유출 대응

- 비번 변경: Settings → Environment variables에서 `SITE_PASSWORD` 수정 → 재배포
- 유출 의심: `AUTH_SECRET`도 함께 변경 → **기존 로그인 세션 전부 즉시 무효화**

---

## (선택) 예쁜 주소 + 진짜 SSO — 나중에

`tools.ogaren.com` 같은 사내 서브도메인을 붙이고 싶으면 **Custom domains**에 추가(회사 DNS 권한 필요).
그때는 공용 비번 대신 **Cloudflare Access로 @ogaren.com 구글 로그인**(사용자별 인증, 무료 50명)으로 업그레이드 가능.

## (선택) 다른 repo 도구도 막기

`ogaren-sales-guide`, `ogaren-bed-install-guide`도 각각:
1. Cloudflare Pages 프로젝트로 연결
2. 이 `functions/_middleware.js`를 그대로 복사
3. 같은 `SITE_PASSWORD` / `AUTH_SECRET` 환경변수 설정
→ 동일 비번으로 통합 보호.

## (선택) 로컬 테스트

```powershell
npm i -g wrangler
# repo 루트에 .dev.vars 작성 (이미 .gitignore 처리됨):
#   SITE_PASSWORD=test
#   AUTH_SECRET=anything-long
wrangler pages dev .
```
※ 로컬은 http라 `Secure` 쿠키가 안 붙어 로그인 유지가 안 될 수 있음 → **최종 확인은 배포본(https)에서** 권장.
