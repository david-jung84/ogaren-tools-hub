# 오가렌 사내 도구 인증 허브

직원들이 산발적으로 만든 HTML 도구·대시보드를 **한 곳에서 보고, "이게 진짜 최신 공식본인지" 검증할 수 있게** 하는 허브입니다.

운영: DX팀 · 문의: david.jung@ogaren.com

---

## 무엇을 해결하는가

**Before**: 직원들이 Claude로 HTML 도구를 만들어 카톡·메일·드라이브로 뿌림 → 한 도구의 v1, v2, v3가 매장마다 다 다름 → 누가 진짜 최신본인지 모름.

**After**: 모든 사내 도구가 이 허브에 등록됨 → 우상단에 박힌 **DX 인증 배지**가 진짜 최신본의 증거 → 매니저는 배지 클릭해서 허브에서 검증.

---

## 3가지 상태

| 라벨 | 의미 | 누가 | 책임 |
|---|---|---|---|
| 🟢 **DX 인증** | DX팀이 검토하고 정식 배포 경로(GitHub → Pages/Workers)를 거친 도구 | DX팀이 빌드/배포 | DX팀 |
| 🟡 **베타** | DX팀이 만들거나 검토 중이지만 아직 정식 인증 전 | DX팀 + 담당 부서 | 담당 부서 (DX 지원) |
| ⚪ **개인본** | 직원이 자체 제작해서 본인 책임으로 사용. 등록만 한 상태 | 본인 | 본인 |

**인증 배지(🟢)는 DX팀만 발급합니다.** 개인본·베타에는 박을 수 없습니다.

---

## 직원 입장: 어떻게 등록·인증받나

### A. 등록만 하기 (⚪ 개인본)
1. DX 요청폼에 **"도구 허브 등록"** 카테고리로 신청
2. 도구 이름·설명·URL·담당자 입력
3. 다음 격주 트리아지에서 ⚪ 개인본으로 등록 (보통 1주 내)

### B. 인증받기 (🟢 DX 인증)
1. DX 요청폼에 **"도구 인증 신청"** 카테고리로 신청 (P3)
2. DX팀이 검토 — 코드·보안·UX·중복성 체크
3. 통과하면 DX repo로 이관 → GitHub Pages/Cloudflare Pages 배포 → 인증 배지 자동 삽입
4. SLA: 표준 영업일 5일 (격주 트리아지 따라)

### 인증 거절 4가지 (기존 DX 인테이크 체계 참고)
- 단발성 (1회 쓰고 버리는 도구)
- SoT(Single Source of Truth) 없음
- 인터페이스 거부 (기존 시스템과 충돌)
- ROI 부족

---

## DX팀 입장: 운영 방법

### 신규 도구 추가
1. `tools.json`에 항목 추가
2. `status`, `version`, `last_updated`, `certified_at` 입력
3. Git commit + push → Cloudflare Pages 자동 배포

### 인증 발급
1. 도구를 DX repo로 이관 (또는 기존 repo를 DX가 인수)
2. 표준 빌드 파이프라인에 등록 (배지 자동 삽입)
3. `tools.json`의 `status`를 `certified`로 변경
4. `certified_at` 입력

### 인증 회수
- 6개월 이상 미업데이트 → ⚪ 개인본으로 강등
- 보안 이슈 발견 → 즉시 회수, 알림 발송
- 담당자 퇴사 → 다음 담당자 지정 또는 회수

---

## 기술 스택

- **Frontend**: Vanilla HTML/CSS/JS (프레임워크 없음)
- **데이터**: `tools.json` (수동 또는 자동 생성)
- **호스팅 (Phase 2)**: GitHub repo `ogaren-tools-hub` + Cloudflare Pages
- **도메인 (Phase 3)**: `tools.ogaren.com` (옵션)
- **사내 인증 (Phase 3)**: Cloudflare Access — `@ogaren.com` 이메일 화이트리스트 (50명 무료)
- **비용**: 0원

---

## 파일 구조

```
도구_인증허브/
├── index.html       # 메인 허브 페이지 (카드 그리드)
├── tools.json       # 도구 인벤토리 데이터
├── badge.html       # DX 인증 배지 표준 snippet (직원 안내용)
└── README.md        # 이 문서
```

---

## 로드맵

| Phase | 내용 | 시점 |
|---|---|---|
| **Phase 0 (지금)** | 로컬 PoC. `index.html` 브라우저로 직접 열어 확인 | 2026-05-26 |
| **Phase 1** | GitHub repo `ogaren-tools-hub` 생성, push, GitHub Pages 공개 | 다음 (이번 주) |
| **Phase 2** | Cloudflare Pages 연결, `badge.js` 자동 로더 제공 | 2026-06 |
| **Phase 3** | 커스텀 도메인 (`tools.ogaren.com`) + Cloudflare Access 사내 인증 | 2026-06~07 |
| **Phase 4** | 인벤토리 폼 → tools.json 자동 생성 (Apps Script) | 2026-07 |

---

## 연관 메모

- DX 요청 인테이크 체계 — 격주 월·수 트리아지, P0~P4 체계, 6요소 100점
- DX 5-스트림 포트폴리오 — 자동화·MTS·검증·고객배송·현금영수증
- 전사 배포 산출물 규칙 — PDF 배포본 + DX 보관 원본
