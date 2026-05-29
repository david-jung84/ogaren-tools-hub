/**
 * 오가렌 사내 도구 인벤토리 수집 폼 자동 생성
 *
 * 사용법:
 * 1. https://script.google.com 접속 → 새 프로젝트
 * 2. 이 파일 내용 전체를 Code.gs에 붙여넣기
 * 3. createInventoryForm() 함수 선택 후 실행 ▶
 * 4. 처음이면 권한 승인 요청이 뜸 — 허용
 * 5. 로그(Ctrl+Enter)에 폼 URL이 출력됨
 *
 * 정책 (사내 G-Suite 규칙):
 * - setCollectEmail(false): 이메일 자동수집 안 함
 * - setRequireLogin(true): @ogaren.com 로그인 필수
 * - 이메일 질문 안 받음 — 신원은 "이름+부서"로 식별
 *
 * 결과:
 * - 폼 URL: 직원에게 공유
 * - 응답 시트: 자동 연결됨 → DX팀이 격주 트리아지에서 검토
 */

function createInventoryForm() {
  const form = FormApp.create('🛠️ 오가렌 사내 도구 인벤토리 수집');

  form
    .setTitle('🛠️ 오가렌 사내 도구 인벤토리 수집')
    .setDescription([
      '직원분들이 만들어 사용 중인 HTML 도구·대시보드를 한 곳에 모으기 위한 폼입니다.',
      '',
      '✅ 등록 대상',
      '- Claude·ChatGPT 등으로 만든 HTML 도구',
      '- Google Sheets 대시보드',
      '- 부서 내 공유 중인 모든 자체 제작 도구',
      '',
      '🟢 DX 인증을 받으면 — 우상단에 인증 배지가 자동으로 박혀서 "이게 진짜 최신본"임을 누구나 확인할 수 있게 됩니다.',
      '⚪ 등록만 원하면 — 허브에 "개인본"으로 표시됩니다 (자체 책임).',
      '',
      '📅 격주 월·수 트리아지에서 검토 후 회신드립니다.',
      '문의: david.jung@ogaren.com'
    ].join('\n'))
    .setCollectEmail(false)         // 이메일 자동수집 X
    .setRequireLogin(true)          // @ogaren.com 로그인 필수
    .setAllowResponseEdits(true)
    .setLimitOneResponsePerUser(false);

  // ===== 질문 1. 신청 유형 =====
  form.addMultipleChoiceItem()
    .setTitle('1. 신청 유형')
    .setHelpText('인증을 받으려면 DX팀 검토 후 도구를 DX repo로 이관합니다 (5영업일).')
    .setChoiceValues([
      '🟢 DX 인증 신청 (검토 후 정식 인증)',
      '⚪ 등록만 (개인본으로 허브에 표시)'
    ])
    .setRequired(true);

  // ===== 질문 2. 도구 이름 =====
  form.addTextItem()
    .setTitle('2. 도구 이름')
    .setHelpText('예: "이카운트 품목코드 조회", "매출 일일 대시보드"')
    .setRequired(true);

  // ===== 질문 3. 한 줄 설명 =====
  form.addTextItem()
    .setTitle('3. 한 줄 설명 (무엇을 하는 도구?)')
    .setHelpText('예: "쇼룸 매니저용 품목코드 빠른 조회 — 옵션 순서 그대로 클릭"')
    .setRequired(true);

  // ===== 질문 4. 소속 부서·담당자 =====
  form.addTextItem()
    .setTitle('4. 소속 부서 · 담당자')
    .setHelpText('예: "온라인영업팀 · 허수지" — 이메일은 적지 않으셔도 됩니다 (사내 로그인으로 자동 식별)')
    .setRequired(true);

  // ===== 질문 5. 현재 위치 =====
  form.addParagraphTextItem()
    .setTitle('5. 도구가 현재 어디에 있나요?')
    .setHelpText('URL이 있으면 URL, 없으면 파일 경로 (예: 공유 드라이브 경로, 데스크탑, 카톡 공유 등)')
    .setRequired(true);

  // ===== 질문 6. 누가 사용하나 =====
  form.addTextItem()
    .setTitle('6. 누가 주로 사용하나요?')
    .setHelpText('예: "매장 매니저 전점", "재무팀", "본인만"')
    .setRequired(true);

  // ===== 질문 7. 사용 빈도 =====
  form.addMultipleChoiceItem()
    .setTitle('7. 얼마나 자주 사용하나요?')
    .setChoiceValues([
      '매일',
      '주 1~2회',
      '월 1~2회',
      '단발성 (이미 끝남)',
      '잘 모르겠음'
    ])
    .setRequired(true);

  // ===== 질문 8. 민감 정보 =====
  form.addMultipleChoiceItem()
    .setTitle('8. 도구 안에 민감한 정보가 포함되어 있나요?')
    .setHelpText('GitHub Pages 공개 배포 가능 여부를 가립니다. 민감 정보가 있으면 Cloudflare Access 사내 인증으로 별도 배포합니다.')
    .setChoiceValues([
      '없음 — 일반 정보만 (제품 코드, 가이드, 공개 가능)',
      '약간 — 부서 내부 정보 (사내 한정 배포 필요)',
      '높음 — 매출·재무·인사 데이터 포함 (사내 인증 필수)',
      '잘 모르겠음 — DX팀이 검토해주세요'
    ])
    .setRequired(true);

  // ===== 질문 9. 마지막 업데이트 =====
  form.addTextItem()
    .setTitle('9. 마지막으로 업데이트한 시점 (대략 OK)')
    .setHelpText('예: "이번 주", "지난 달", "올해 초", "기억 안 남"')
    .setRequired(false);

  // ===== 질문 10. 추가 메모 =====
  form.addParagraphTextItem()
    .setTitle('10. 기타 전달사항 (선택)')
    .setHelpText('예: "PDF 출력 기능 추가하고 싶음", "다른 부서도 쓸 수 있게 일반화하면 좋겠음"')
    .setRequired(false);

  // ===== 응답 시트 자동 연결 =====
  const ss = SpreadsheetApp.create('🛠️ 도구 인벤토리 응답');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // ===== 결과 로그 =====
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('✅ 폼 생성 완료');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📝 응답 폼 (직원 공유용): ' + form.getPublishedUrl());
  Logger.log('✏️ 폼 편집 URL: ' + form.getEditUrl());
  Logger.log('📊 응답 시트: ' + ss.getUrl());
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('다음 단계:');
  Logger.log('1. 폼 편집 URL로 가서 디자인·색상 최종 점검');
  Logger.log('2. 응답 폼 URL을 사내 공지/슬랙으로 공유');
  Logger.log('3. 격주 트리아지에서 응답 검토 → tools.json에 반영');
}
