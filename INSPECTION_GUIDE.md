# OpenWAX Rules 검사 가이드

KWCAG 2.2(한국형 웹 콘텐츠 접근성 지침 2.2) 기준에 따른 웹 접근성 자동 검사 라이브러리 상세 가이드

## 목차

1. [검사 결과 해석](#검사-결과-해석)
2. [5.1.1 적절한 대체 텍스트 제공](#511-적절한-대체-텍스트-제공)
3. [5.3.1 표의 구성](#531-표의-구성)
4. [6.1.2 초점 이동과 표시](#612-초점-이동과-표시)
5. [6.4.1 반복 영역 건너뛰기](#641-반복-영역-건너뛰기)
6. [6.4.2 제목 제공](#642-제목-제공)
7. [7.1.1 기본 언어 표시](#711-기본-언어-표시)
8. [7.2.1 사용자 요청에 의한 새창/팝업](#721-사용자-요청에-의한-새창팝업)
9. [7.3.2 레이블 제공](#732-레이블-제공)
10. [8.2.1 웹 애플리케이션 접근성 준수](#821-웹-애플리케이션-접근성-준수)

---

## 검사 결과 해석

모든 검사 결과는 다음 3가지 수준으로 평가됩니다:

- **`pass`**: 접근성 기준을 완전히 만족 ✅
- **`warning`**: 개선 권장사항이 있음 ⚠️ (통과 수준)
- **`fail`**: 접근성 기준을 위반, 즉시 수정 필요 ❌

---

## 5.1.1 적절한 대체 텍스트 제공

### checkImages() - 이미지 대체 텍스트 검사

**KWCAG 2.2 기준**: 이미지는 그 의미를 설명하는 적절한 대체 텍스트를 제공해야 한다.

#### 검사 대상
- `<img>` 태그
- `<input type="image">` 태그  
- `<area>` 태그

#### 검사 로직

##### 1. 이미지 용도별 분류
```typescript
// 상호작용 이미지 (가장 엄격)
const isInteractive = !!(
  img.closest('a, button, [role="button"]') ||
  img.hasAttribute('onclick') ||
  img.style.cursor === 'pointer'
);

// 장식적 이미지
const isDecorative = !!(
  img.getAttribute('role') === 'presentation' ||
  img.getAttribute('role') === 'none'
);

// 무의미한 alt 텍스트 감지 (17개 패턴)
const meaninglessPatterns = [
  /^image$/i, /^그림$/i, /^icon$/i, /^logo$/i, 
  /^\d+\.(jpg|jpeg|png|gif|webp)$/i, // 파일명 등
  // ... 총 17개 패턴
];
```

##### 2. 판정 기준
| 상황 | alt 속성 없음 | alt="" | alt="무의미" | alt="적절한 설명" |
|------|---------------|--------|-------------|-----------------|
| **상호작용 이미지** | ❌ fail | ❌ fail | ❌ fail | ✅ pass |
| **장식적 이미지** | ❌ fail | ✅ pass | ⚠️ warning | ⚠️ warning |
| **일반 이미지** | ❌ fail | ⚠️ warning | ⚠️ warning | ✅ pass |

#### 개선 방안
- **상호작용 이미지**: 기능과 목적을 명확히 설명하는 alt 제공
- **장식적 이미지**: `alt=""` 또는 `role="presentation"` 사용
- **일반 이미지**: 이미지의 의미와 내용을 설명하는 alt 제공

---

### checkBgImages() - 배경 이미지 검사

**검사 대상**: CSS `background-image` 속성을 가진 모든 요소

#### 검사 로직
```typescript
// 배경 이미지가 있는 요소 필터링
const hasBackground = style.backgroundImage !== 'none';

// 대체 텍스트 확인 우선순위
const altText = 
  el.getAttribute('aria-label') ||
  el.getAttribute('title') ||
  el.textContent?.trim();

// 상호작용 요소 확인
const isInteractive = !!(
  el.closest('button, a, [role="button"]') || 
  el.hasAttribute('tabindex') ||
  el.getAttribute('role') === 'button'
);
```

#### 판정 기준
- **상호작용 요소 + 대체 텍스트 없음**: ❌ fail
- **일반 요소 + 대체 텍스트 없음**: ⚠️ warning
- **대체 텍스트 있음**: ✅ pass

---

## 5.3.1 표의 구성

### checkTables() - 표 구성 검사

**KWCAG 2.2 기준**: 표는 제목 셀과 데이터 셀이 구분되어야 하며, 표의 내용과 구조를 이해할 수 있는 정보를 제공해야 한다.

#### 검사 로직

##### 1. 표 라벨 확인 (우선순위)
```typescript
// 1순위: aria-labelledby (외부 요소 참조)
if (ariaLabelledBy && document.getElementById(ariaLabelledBy)) {
  return document.getElementById(ariaLabelledBy).textContent;
}
// 2순위: aria-label (직접 라벨)
// 3순위: caption (표 제목)
// 4순위: summary (표 요약)
```

##### 2. 표 구조 분석
```typescript
const hasTh = allCells.some(cell => cell.tag === 'th');
const hasScopeTh = allCells.some(cell => 
  cell.tag === 'th' && cell.scope
);
```

##### 3. 판정 기준
| 조건 | 결과 |
|------|------|
| `role="presentation"` | ⚠️ warning (레이아웃 테이블) |
| th 없음 | ❌ fail |
| 라벨 + scope 있는 th | ✅ pass |
| 라벨 + th (scope 없음) | ⚠️ warning |
| th만 있음 (라벨 없음) | ⚠️ warning |

#### 개선 방안
- **데이터 테이블**: `<caption>` 또는 `aria-label` + `<th scope="col/row">`
- **레이아웃 테이블**: `role="presentation"` (권장하지 않음)
- **복잡한 표**: `headers` 속성과 `id` 연결 활용

---

## 6.1.2 초점 이동과 표시

### checkFocus() - 키보드 초점 검사

**KWCAG 2.2 기준**: 키보드로 접근 가능한 모든 요소는 초점이 명확하게 표시되어야 한다.

#### 검사 대상
문제가 있는 요소만 반환 (일반적으로 빈 배열)

#### 검사 로직
```typescript
// 1. blur() 이벤트 감지
const hasBlurEvent = 
  (onfocus && onfocus.includes('blur()')) ||
  (onclick && onclick.includes('blur()'));

// 2. outline 제거 감지
const hasOutlineZero = 
  outlineWidth === '0px' || outlineWidth === '0' ||
  cssText.includes('outline: none') ||
  cssText.includes('outline: 0');
```

#### 판정 기준
- **blur() 이벤트 사용**: ❌ fail
- **outline 제거**: ❌ fail
- **정상**: 결과에 미포함 (빈 배열)

#### 개선 방안
- `blur()` 이벤트 제거
- `outline: none` 대신 커스텀 포커스 스타일 제공
- `:focus-visible` 활용 권장

---

## 6.4.1 반복 영역 건너뛰기

### checkSkipNav() - 스킵 네비게이션 검사

**KWCAG 2.2 기준**: 반복되는 내용 블록을 건너뛸 수 있는 방법을 제공해야 한다.

#### 검사 대상
페이지 상단의 처음 20개 링크 중 `href`가 `#`으로 시작하는 링크

#### 검사 로직
```typescript
// 앵커 링크 확인
if (!a.getAttribute('href')?.startsWith('#')) return null;

// 연결된 요소 확인
const targetId = href.replace('#', '');
const isConnected = 
  document.getElementById(targetId) ||
  document.getElementsByName(targetId).length > 0;
```

#### 판정 기준
- **연결된 요소 존재**: ✅ pass
- **연결된 요소 없음**: ❌ fail
- **href="#"**: ❌ fail

#### 개선 방안
```html
<!-- Good -->
<a href="#main-content">본문으로 바로가기</a>
<main id="main-content">...</main>

<!-- Bad -->
<a href="#">본문으로 바로가기</a>
<a href="#nonexistent">존재하지 않는 링크</a>
```

---

## 6.4.2 제목 제공

### checkPageTitle() - 페이지 제목 검사

#### 검사 로직
```typescript
const title = document.title;
const hasTitle = !!title;
const hasSpecialCharactersDup = dupCharacters.some(char => 
  title.includes(char)
);
```

#### 판정 기준
- **제목 있음 + 특수문자 중복 없음**: ✅ pass
- **제목 없음 또는 특수문자 중복**: ❌ fail

### checkFrames() - 프레임 제목 검사

#### 검사 대상
모든 `<iframe>` 요소 (중첩된 프레임 포함)

#### 판정 기준
- **title 속성 있음**: ✅ pass
- **title 속성 없음**: ❌ fail

### checkHeadings() - 콘텐츠 블록 제목 검사

#### 검사 대상
`h1` ~ `h6` 요소 (모든 결과는 pass)

---

## 7.1.1 기본 언어 표시

### checkPageLang() - 페이지 언어 검사

**KWCAG 2.2 기준**: 웹 페이지의 기본 언어를 명시해야 한다.

#### 검사 로직
```typescript
const isXhtml = html.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml';
const lang = html.getAttribute('lang');
const xmlLang = html.getAttribute('xml:lang');
```

#### 판정 기준 (XHTML vs HTML)
| 문서 타입 | lang | xml:lang | 결과 |
|-----------|------|----------|------|
| **XHTML** | ✓ | ✓ | ✅ pass |
| **XHTML** | ✗ | ✓ | ⚠️ warning |
| **HTML** | ✓ | - | ✅ pass |
| **모든 타입** | ✗ | ✗ | ❌ fail |

---

## 7.2.1 사용자 요청에 의한 새창/팝업

### checkUserRequest() - 새창/팝업 검사

**검사 대상**: `window.open`을 사용하는 `a, area, input, button` 요소

#### 검사 로직
```typescript
// window.open 감지 (inline onclick만)
const hasWindowOpen = onclick && /window\.open\s*\(/.test(onclick);

// 새창임을 알리는 방법들
const hasTarget = el.getAttribute('target') === '_blank';
const hasTitle = !!el.getAttribute('title');
const hasNewWindowText = text.includes('새창') || 
  text.includes('팝업') || text.includes('new win');
```

#### 판정 기준
- **target="_blank" 있음**: ✅ pass
- **title 속성 있음**: ✅ pass  
- **새창 관련 텍스트 포함**: ✅ pass
- **위 조건 모두 없음**: ❌ fail

---

## 7.3.2 레이블 제공

### checkInputLabels() - 입력 요소 라벨 검사

**검사 대상**: 텍스트 입력 관련 요소 (`input[type="button|submit|reset|hidden|image"]` 제외)

#### 검사 로직
```typescript
// 1순위: 연결된 label
const labelElement = document.querySelector(`label[for="${input.id}"]`);

// 2순위: 부모 label  
const parentLabel = input.closest('label');

// 3순위: title 속성
const title = input.getAttribute('title');
```

#### 판정 기준
- **label 연결**: ✅ pass
- **title만 있음**: ⚠️ warning
- **둘 다 없음**: ❌ fail

---

## 8.2.1 웹 애플리케이션 접근성 준수

### checkWebApplication() - ARIA 인터페이스 검사

**KWCAG 2.2 기준**: WAI-ARIA 역할 기반의 인터페이스는 적절한 구조와 속성을 가져야 한다.

#### 검사하는 ARIA 인터페이스

##### 1. Tablist 인터페이스
```typescript
// 구조: tablist > tab + tabpanel (aria-controls로 연결)
const tabs = tablist.querySelectorAll('[role="tab"]');
const connectedTabpanels = tabs의 aria-controls로 연결된 tabpanel들;
```

**판정 기준**:
- tab 없음: ❌ fail
- tab 있지만 연결된 tabpanel 없음: ❌ fail  
- tab과 tabpanel 수 불일치: ⚠️ warning
- 모든 조건 충족: ✅ pass

##### 2. Menu 인터페이스
**구조**: `menubar|menu > menuitem|menuitemcheckbox|menuitemradio`

##### 3. Combobox 인터페이스  
**구조**: `combobox + listbox > option` (내부 또는 aria-controls 연결)

##### 4. Grid/Table 인터페이스
**구조**: `grid|table > row > cell|columnheader|rowheader`

##### 5. Tree 인터페이스
**구조**: `tree > treeitem + group (선택적)`

##### 6. Dialog 인터페이스
**요구사항**: `aria-labelledby|aria-label|heading` 중 하나 필요

##### 7. Toolbar 인터페이스
**요구사항**: 상호작용 요소 (`button, a, input`) 포함

##### 8. Listbox 인터페이스
**구조**: `listbox > option + group (선택적)`

##### 9. Radiogroup 인터페이스
**구조**: `radiogroup > radio`

#### 공통 판정 기준
- **필수 구조 누락**: ❌ fail
- **권장사항 미충족**: ⚠️ warning  
- **모든 요구사항 충족**: ✅ pass

---

## 종합 개선 가이드

### 우선순위별 대응
1. **❌ fail 항목**: 즉시 수정 필요 (접근성 차단)
2. **⚠️ warning 항목**: 사용자 경험 개선을 위해 권장
3. **✅ pass 항목**: 현재 상태 유지

### 자동화 한계
- **의미적 판단 필요**: 이미지의 실제 의미, 표의 복잡성
- **동적 콘텐츠**: JavaScript로 생성되는 콘텐츠
- **컨텍스트 의존**: 사용자 의도와 페이지 목적

### 수동 검토 권장 영역
- 이미지 alt 텍스트의 적절성
- 복잡한 표의 headers-id 연결
- ARIA 레이블의 의미적 정확성
- 키보드 탐색 플로우의 논리성

---

## 부록: 실제 HTML 예시

### A1. 이미지 접근성 모범 사례

#### ✅ 올바른 예시
```html
<!-- 상호작용 이미지 -->
<a href="/products">
  <img src="products-banner.jpg" alt="제품 페이지로 이동">
</a>

<!-- 정보 전달 이미지 -->
<img src="chart.jpg" alt="2024년 1분기 매출 증가율 15% 차트">

<!-- 장식적 이미지 -->
<img src="decoration.jpg" alt="" role="presentation">

<!-- 복합 정보가 있는 이미지 -->
<img src="infographic.jpg" alt="COVID-19 예방 수칙 인포그래픽" longdesc="covid-description.html">
```

#### ❌ 잘못된 예시
```html
<!-- 무의미한 alt -->
<img src="banner.jpg" alt="image">
<img src="chart.jpg" alt="그림">
<img src="logo.jpg" alt="logo.png">

<!-- 상호작용 이미지에 빈 alt -->
<a href="/home"><img src="home-icon.jpg" alt=""></a>

<!-- alt 속성 누락 -->
<img src="important-info.jpg">
```

### A2. 표 구조 모범 사례

#### ✅ 올바른 예시
```html
<!-- 단순 데이터 표 -->
<table aria-label="2024년 분기별 매출">
  <thead>
    <tr>
      <th scope="col">분기</th>
      <th scope="col">매출액</th>
      <th scope="col">증감률</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1분기</th>
      <td>1,200만원</td>
      <td>+15%</td>
    </tr>
    <tr>
      <th scope="row">2분기</th>
      <td>1,350만원</td>
      <td>+12.5%</td>
    </tr>
  </tbody>
</table>

<!-- 외부 제목으로 라벨링 -->
<h2 id="sales-table">지역별 매출 현황</h2>
<table aria-labelledby="sales-table">
  <thead>
    <tr>
      <th scope="col">지역</th>
      <th scope="col">매출</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">서울</th>
      <td>500만원</td>
    </tr>
  </tbody>
</table>

<!-- 복잡한 표 (headers 속성 사용) -->
<table>
  <caption>부서별 직급별 인원 현황</caption>
  <thead>
    <tr>
      <th id="dept">부서</th>
      <th id="manager">과장</th>
      <th id="staff">직원</th>
      <th id="total">합계</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th id="dev" headers="dept">개발팀</th>
      <td headers="dev manager">3</td>
      <td headers="dev staff">12</td>
      <td headers="dev total">15</td>
    </tr>
  </tbody>
</table>
```

#### ❌ 잘못된 예시
```html
<!-- th 없는 데이터 표 -->
<table>
  <caption>매출 데이터</caption>
  <tr>
    <td>분기</td>
    <td>매출</td>
  </tr>
  <tr>
    <td>1분기</td>
    <td>1200만원</td>
  </tr>
</table>

<!-- 라벨 없는 표 -->
<table>
  <thead>
    <tr>
      <th>컬럼1</th>
      <th>컬럼2</th>
    </tr>
  </thead>
</table>

<!-- 레이아웃 목적인데 데이터 표로 구성 -->
<table>
  <tr>
    <td><img src="logo.jpg" alt="회사 로고"></td>
    <td>회사 이름</td>
  </tr>
</table>
<!-- 위 경우 CSS Grid나 Flexbox 사용 권장 -->
```

### A3. 폼 라벨링 모범 사례

#### ✅ 올바른 예시
```html
<!-- 명시적 라벨 연결 -->
<label for="username">사용자명:</label>
<input type="text" id="username" name="username">

<!-- 묵시적 라벨 연결 -->
<label>
  비밀번호:
  <input type="password" name="password">
</label>

<!-- 복잡한 폼의 그룹핑 -->
<fieldset>
  <legend>개인정보</legend>
  <label for="name">성명:</label>
  <input type="text" id="name" name="name">
  
  <label for="email">이메일:</label>
  <input type="email" id="email" name="email">
</fieldset>

<!-- 라디오 버튼 그룹 -->
<fieldset>
  <legend>성별</legend>
  <label><input type="radio" name="gender" value="male"> 남성</label>
  <label><input type="radio" name="gender" value="female"> 여성</label>
</fieldset>
```

#### ❌ 잘못된 예시
```html
<!-- 라벨 없는 입력 필드 -->
<input type="text" placeholder="이름을 입력하세요">

<!-- 연결되지 않은 라벨 -->
<label>이메일:</label>
<input type="email" name="email">

<!-- title만 사용 (권장하지 않음) -->
<input type="text" name="username" title="사용자명">
```

### A4. 키보드 접근성 모범 사례

#### ✅ 올바른 예시
```html
<!-- 커스텀 포커스 스타일 -->
<style>
.custom-button:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}
/* 또는 */
.modern-focus:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}
</style>

<button class="custom-button">클릭 가능한 버튼</button>
<a href="#main" class="modern-focus">본문으로 바로가기</a>
```

#### ❌ 잘못된 예시
```html
<!-- 포커스 제거 (접근성 위반) -->
<style>
button:focus { outline: none; }
a:focus { outline: 0; }
</style>

<!-- blur() 사용 (키보드 사용자 차단) -->
<button onclick="this.blur()">버튼</button>
<input onfocus="blur()">
```

### A5. ARIA 인터페이스 모범 사례

#### ✅ 올바른 탭 인터페이스
```html
<div role="tablist" aria-label="제품 정보">
  <button role="tab" aria-controls="panel1" aria-selected="true" id="tab1">
    설명
  </button>
  <button role="tab" aria-controls="panel2" aria-selected="false" id="tab2">
    리뷰
  </button>
  <button role="tab" aria-controls="panel3" aria-selected="false" id="tab3">
    Q&A
  </button>
</div>

<div role="tabpanel" id="panel1" aria-labelledby="tab1">
  <h3>제품 설명</h3>
  <p>제품에 대한 상세 설명...</p>
</div>

<div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
  <h3>사용자 리뷰</h3>
  <p>리뷰 내용...</p>
</div>

<div role="tabpanel" id="panel3" aria-labelledby="tab3" hidden>
  <h3>질문과 답변</h3>
  <p>Q&A 내용...</p>
</div>
```

#### ✅ 올바른 다이얼로그
```html
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">확인 필요</h2>
  <p>정말로 삭제하시겠습니까?</p>
  <button type="button">확인</button>
  <button type="button">취소</button>
</div>
```

### A6. 건너뛰기 링크 구현

#### ✅ 올바른 예시
```html
<!-- 페이지 상단 -->
<a href="#main-content" class="skip-link">본문으로 바로가기</a>
<a href="#navigation" class="skip-link">내비게이션으로 바로가기</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
</style>

<!-- 페이지 본문 -->
<nav id="navigation">
  <!-- 네비게이션 메뉴 -->
</nav>

<main id="main-content">
  <h1>페이지 제목</h1>
  <!-- 본문 내용 -->
</main>
```

### A7. 페이지 타이틀 및 언어 설정

#### ✅ 올바른 예시
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <title>제품 목록 - 온라인 쇼핑몰</title>
  <meta charset="UTF-8">
</head>
<body>
  <!-- 페이지 내용 -->
</body>
</html>

<!-- 다국어 콘텐츠 -->
<html lang="ko">
<head>
  <title>회사 소개 - ABC Corporation</title>
</head>
<body>
  <p>한국어 내용입니다.</p>
  <p lang="en">This is English content within Korean page.</p>
</body>
</html>
```

#### ❌ 잘못된 예시
```html
<!-- 언어 설정 없음 -->
<html>
<head>
  <title>페이지</title>
</head>

<!-- 의미 없는 특수문자 반복 -->
<html lang="ko">
<head>
  <title>메인 페이지 :: 회사명 :: 서비스명</title>
</head>

<!-- 제목 없음 -->
<html lang="ko">
<head>
</head>
```

---

## FAQ

### Q1: 모든 이미지에 alt 속성이 필요한가요?
**A**: 장식적 이미지는 `alt=""` 또는 `role="presentation"`을 사용하여 스크린 리더가 건너뛰도록 할 수 있습니다. 의미있는 이미지만 적절한 대체 텍스트가 필요합니다.

### Q2: CSS로 outline을 제거하면 안 되나요?
**A**: `outline: none`보다는 커스텀 포커스 스타일을 제공하는 것이 좋습니다. `:focus-visible`을 사용하여 키보드 사용자에게만 포커스를 표시할 수도 있습니다.

### Q3: 테이블에서 scope 속성이 꼭 필요한가요?
**A**: 단순한 테이블에서는 선택적이지만, 복잡한 테이블에서는 필수입니다. scope 속성이 있으면 스크린 리더 사용자의 이해를 도울 수 있습니다.

### Q4: ARIA 라벨과 일반 라벨의 차이는?
**A**: ARIA 라벨(`aria-label`, `aria-labelledby`)은 보조 기술에서만 읽히고, 일반 라벨(`<label>`, `<caption>`)은 모든 사용자에게 표시됩니다. 상황에 따라 적절히 선택하세요.

---

*이 문서는 OpenWAX Rules v1.0.0 기준으로 작성되었습니다. KWCAG 2.2 완전 준수를 위해서는 자동 검사와 함께 수동 검토를 병행하시기 바랍니다.*
