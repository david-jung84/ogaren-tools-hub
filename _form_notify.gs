/**
 * 도구 인벤토리 폼 — 새 응답 시 이메일 알림 (자동)
 *
 * 누군가 등록 폼을 제출하면 즉시 NOTIFY_EMAIL 로 신청 내용을 담은 메일이 발송됩니다.
 * (지금까진 응답 시트에 조용히 쌓이기만 해서, 직접 열어봐야 알 수 있었음 → 이걸로 해결)
 *
 * ───────── 설치 방법 (1회, 약 2분) ─────────
 * 1. 응답 시트 열기:
 *    https://docs.google.com/spreadsheets/d/1JblsrQxqe5afhWqczNzZmX7M4t4A_TZEjS7AvXOoEEw/edit
 * 2. 상단 메뉴 → 확장 프로그램(Extensions) → Apps Script
 * 3. 기존 코드 다 지우고 이 파일 내용 전체를 붙여넣기
 * 4. 함수 드롭다운에서 setupTrigger 선택 → ▶ 실행
 * 5. 권한 승인 요청이 뜨면 허용 (본인 Google 계정으로 메일 보내는 권한)
 * 6. 로그에 "트리거 설치 완료" 가 뜨면 끝.
 *
 * 이후 폼이 제출될 때마다 자동으로 메일이 옵니다. (별도 실행 불필요)
 * 알림 주소를 바꾸려면 아래 NOTIFY_EMAIL 만 수정하고 setupTrigger 를 다시 실행.
 */

// 알림 받을 주소. 여러 명이면 콤마로: "a@ogaren.com, b@ogaren.com"
const NOTIFY_EMAIL = "david.jung@ogaren.com";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1JblsrQxqe5afhWqczNzZmX7M4t4A_TZEjS7AvXOoEEw/edit";

/**
 * 폼 제출 시 자동 호출 (설치형 트리거가 연결)
 * e.values = 시트 행 순서: [Timestamp, 신청유형, 도구이름, 설명, 부서·담당자,
 *            현재위치, 사용자, 사용빈도, 민감정보, 마지막업데이트, 기타메모]
 */
function onFormSubmitNotify(e) {
  const v = e.values || [];
  const get = (i) => (v[i] != null ? String(v[i]).trim() : "");

  const ts        = get(0);
  const type      = get(1);
  const toolName  = get(2);
  const desc      = get(3);
  const owner     = get(4);
  const location  = get(5);
  const user      = get(6);
  const freq      = get(7);
  const sensitive = get(8);
  const updated   = get(9);
  const memo      = get(10);

  // 인증 신청이면 제목에 🟢, 등록만이면 ⚪
  const flag = type.indexOf("인증") >= 0 ? "🟢 인증신청" : "⚪ 등록";
  const subject = `[도구 허브] ${flag} · ${toolName} (${owner})`;

  const body = [
    `새 도구 ${flag} 신청이 접수되었습니다.`,
    ``,
    `■ 신청 유형     : ${type}`,
    `■ 도구 이름     : ${toolName}`,
    `■ 한 줄 설명    : ${desc}`,
    `■ 소속·담당자   : ${owner}`,
    `■ 현재 위치     : ${location}`,
    `■ 사용자        : ${user}`,
    `■ 사용 빈도     : ${freq}`,
    `■ 민감 정보     : ${sensitive}`,
    `■ 마지막 업데이트: ${updated}`,
    `■ 기타          : ${memo || "-"}`,
    ``,
    `──────────────────────`,
    `접수 시각 : ${ts}`,
    `응답 시트 : ${SHEET_URL}`,
    ``,
    `※ 민감 정보가 "약간"/"높음" 이면 public 배포 금지 — Cloudflare Access 또는 사내 배포로.`,
  ].join("\n");

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

/**
 * 설치형 트리거 등록 (1회 실행)
 */
function setupTrigger() {
  // 중복 방지: 기존 동일 트리거 제거
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === "onFormSubmitNotify") ScriptApp.deleteTrigger(t);
  });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger("onFormSubmitNotify")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  Logger.log("✅ 폼 제출 알림 트리거 설치 완료 → " + NOTIFY_EMAIL);
}

/**
 * (선택) 설치 잘 됐는지 테스트 — 가짜 데이터로 메일 1통 보내보기
 */
function testNotify() {
  onFormSubmitNotify({
    values: [
      new Date().toLocaleString(),
      "🟢 DX 인증 신청 (검토 후 정식 인증)",
      "테스트 도구",
      "알림 동작 확인용 테스트입니다.",
      "DX팀 정지훈",
      "https://example.com",
      "DX팀",
      "매일",
      "없음 — 일반 정보만",
      "오늘",
      "이 메일이 오면 설치 성공",
    ],
  });
  Logger.log("테스트 메일 발송 → " + NOTIFY_EMAIL);
}
