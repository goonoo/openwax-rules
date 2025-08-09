# OpenWAX Rules 개발 로드맵

KWCAG 2.2 완전 준수를 위한 단계적 개발 계획

## 현재 상태 (v1.0.0)

### ✅ 구현 완료된 검사 항목 (11개/33개)

| 검사항목                              | 함수명                                           | 상태    | 비고                           |
| ------------------------------------- | ------------------------------------------------ | ------- | ------------------------------ |
| **5.1.1** 적절한 대체 텍스트 제공     | `checkImages`, `checkBgImages`                   | ✅ 완료 | 이미지 용도별 차별화 검증 포함 |
| **5.3.1** 표의 구성                   | `checkTables`                                    | ✅ 완료 | 현대적 ARIA 속성 지원          |
| **6.1.2** 초점 이동과 표시            | `checkFocus`                                     | ✅ 완료 | blur() 및 outline 제거 감지    |
| **6.4.1** 반복 영역 건너뛰기          | `checkSkipNav`                                   | ✅ 완료 | 앵커 링크 연결 검증            |
| **6.4.2** 제목 제공                   | `checkPageTitle`, `checkFrames`, `checkHeadings` | ✅ 완료 | 페이지/프레임/콘텐츠 블록 제목 |
| **7.1.1** 기본 언어 표시              | `checkPageLang`                                  | ✅ 완료 | HTML/XHTML 구분 검증           |
| **7.2.1** 사용자 요구에 따른 실행     | `checkUserRequest`                               | ✅ 완료 | 새창/팝업 사전 안내            |
| **7.3.2** 레이블 제공                 | `checkInputLabels`                               | ✅ 완료 | 폼 요소 라벨링                 |
| **8.2.1** 웹 애플리케이션 접근성 준수 | `checkWebApplication`                            | ✅ 완료 | 9개 ARIA 인터페이스 검증       |

**커버리지**: 33개 중 11개 완료 (33.3%)

---

## Phase 1: 현재 구현 항목 개선 (v1.1.0)

### 🔧 개선 계획

#### 1. checkImages 고도화

- **현재**: 기본적인 이미지 용도별 검증
- **개선 목표**:
    - 복잡한 이미지(`longdesc` 속성) 지원
    - SVG 이미지 접근성 검증 (`<title>`, `<desc>` 요소)
    - CSS 생성 콘텐츠(::before, ::after) 검사 확장
    - 이미지 맵(`<area>`) 검증 강화

#### 2. checkTables 확장

- **현재**: 기본 테이블 구조 검증
- **개선 목표**:
    - 복잡한 테이블의 `headers`-`id` 연결 검증
    - `colspan`, `rowspan` 사용 시 접근성 검증
    - 레이아웃 테이블 자동 감지 개선
    - 테이블 요약(`summary`) 검증 추가

#### 3. checkWebApplication ARIA 지원 확대

- **현재**: 9개 ARIA 인터페이스
- **개선 목표**:
    - `alert`, `status` 역할 검증
    - `banner`, `main`, `navigation`, `contentinfo` 랜드마크 검증
    - `live region` 속성 검증 (`aria-live`, `aria-atomic`)
    - `aria-expanded`, `aria-pressed` 상태 관리 검증

#### 4. checkFocus 키보드 접근성 강화

- **현재**: 기본적인 outline 제거 감지
- **개선 목표**:
    - `tabindex` 사용 패턴 검증 (양수 값 경고)
    - 키보드 트랩 감지
    - 논리적 탭 순서 검증 (선택사항)
    - `:focus-visible` 지원 확인

---

## Phase 2: 핵심 미구현 항목 추가 (v1.2.0)

### 🆕 새로운 검사 항목 (우선순위 높음)

#### 1. 6.1.1 키보드 사용 보장

```typescript
function checkKeyboardAccessible(): ValidationResult[];
```

- **검사 대상**: 모든 상호작용 요소
- **검증 내용**:
    - 키보드로 접근 불가능한 요소 감지
    - `onclick` 이벤트만 있는 요소 검출
    - `tabindex="-1"`인 focusable 요소 검증

#### 2. 5.4.1 색에 무관한 콘텐츠 인식

```typescript
function checkColorIndependence(): ValidationResult[];
```

- **검사 대상**: 색상으로만 정보를 전달하는 요소
- **검증 내용**:
    - 필수/오류 표시의 색상 의존성 검사
    - 차트/그래프의 색상 구분 대안 확인

#### 3. 5.4.3 텍스트 콘텐츠의 명도 대비

```typescript
function checkColorContrast(): ValidationResult[];
```

- **검사 대상**: 모든 텍스트 요소
- **검증 내용**:
    - 일반 텍스트: 4.5:1 이상
    - 큰 텍스트: 3:1 이상
    - CSS 계산을 통한 실제 명도 대비 측정

#### 4. 6.4.3 적절한 링크 텍스트

```typescript
function checkLinkText(): ValidationResult[];
```

- **검사 대상**: 모든 `<a>` 요소
- **검증 내용**:
    - "여기를 클릭", "더보기" 등 모호한 링크 텍스트 감지
    - `aria-label`, `title` 속성을 통한 보완 확인
    - 같은 텍스트로 다른 목적지를 가리키는 링크 감지

#### 5. 7.3.1 오류 정정

```typescript
function checkErrorCorrection(): ValidationResult[];
```

- **검사 대상**: 폼 검증 및 오류 메시지
- **검증 내용**:
    - 오류 메시지의 명확성 및 접근성
    - `aria-invalid`, `aria-describedby` 연결 검증
    - 오류 필드 식별 방법 확인

---

## Phase 3: 멀티미디어 및 동적 콘텐츠 (v1.3.0)

### 🎬 멀티미디어 검사 항목

#### 1. 5.2.1 자막 제공

```typescript
function checkCaptions(): ValidationResult[];
```

- **검사 대상**: `<video>`, `<audio>` 요소
- **검증 내용**:
    - `<track>` 요소의 자막 제공 여부
    - `controls` 속성을 통한 사용자 제어 가능성

#### 2. 5.4.2 자동 재생 금지

```typescript
function checkAutoPlay(): ValidationResult[];
```

- **검사 대상**: 멀티미디어 요소, 애니메이션
- **검증 내용**:
    - `autoplay` 속성 사용 검사
    - CSS 애니메이션의 `prefers-reduced-motion` 지원

#### 3. 6.2.1 응답시간 조절

```typescript
function checkTimeLimit(): ValidationResult[];
```

- **검사 대상**: 세션 타임아웃, 자동 새로고침
- **검증 내용**:
    - `<meta http-equiv="refresh">` 사용 검사
    - 자바스크립트 타이머 패턴 감지

#### 4. 6.3.1 깜빡임과 번쩍임 사용 제한

```typescript
function checkFlashing(): ValidationResult[];
```

- **검사 대상**: CSS 애니메이션, `<blink>` 요소
- **검증 내용**:
    - 3초 이상 깜빡이는 요소 감지
    - 번쩍임 효과 패턴 분석

---

## Phase 4: 모바일 및 고급 상호작용 (v1.4.0)

### 📱 터치 및 포인터 검사 항목

#### 1. 6.1.3 조작 가능

```typescript
function checkOperability(): ValidationResult[];
```

- **검사 대상**: 터치 타겟
- **검증 내용**:
    - 최소 44×44 픽셀 터치 영역
    - 인접한 요소와의 충분한 간격

#### 2. 6.5.1 단일 포인터 입력 지원

```typescript
function checkPointerInput(): ValidationResult[];
```

- **검사 대상**: 멀티터치 제스처 사용 요소
- **검증 내용**:
    - 단일 포인터로도 조작 가능한 대안 제공 여부

#### 3. 6.5.2 포인터 입력 취소

```typescript
function checkPointerCancellation(): ValidationResult[];
```

- **검사 대상**: 터치/클릭 이벤트 처리
- **검증 내용**:
    - `down` 이벤트에서 완료되는 기능 감지
    - 취소 메커니즘 제공 여부

#### 4. 6.5.4 동작기반 작동

```typescript
function checkMotionActuation(): ValidationResult[];
```

- **검사 대상**: 기기 움직임 감지 기능
- **검증 내용**:
    - 흔들기, 기울이기 등 동작 의존 기능 감지
    - 대안 조작 방법 제공 여부

---

## Phase 5: 고급 구조 및 인증 (v1.5.0)

### 🏗️ 문서 구조 및 인증 검사

#### 1. 5.3.2 콘텐츠의 선형구조

```typescript
function checkLinearStructure(): ValidationResult[];
```

- **검사 대상**: CSS `position`, `float` 사용 요소
- **검증 내용**:
    - DOM 순서와 시각적 순서의 일치성
    - CSS 해제 시에도 이해 가능한 구조

#### 2. 5.3.3 명확한 지시사항 제공

```typescript
function checkInstructions(): ValidationResult[];
```

- **검사 대상**: 폼 입력 안내
- **검증 내용**:
    - 모양, 위치에 의존하지 않는 설명
    - 명확한 입력 형식 안내

#### 3. 6.4.4 고정된 참조 위치 정보

```typescript
function checkConsistentLocation(): ValidationResult[];
```

- **검사 대상**: 네비게이션 메뉴 위치
- **검증 내용**:
    - 페이지 간 일관된 네비게이션 위치

#### 4. 7.3.3 접근 가능한 인증

```typescript
function checkAccessibleAuth(): ValidationResult[];
```

- **검사 대상**: 로그인, 인증 폼
- **검증 내용**:
    - CAPTCHA 대안 제공 여부
    - 인지 기능 테스트 의존성 검사

#### 5. 8.1.1 마크업 오류 방지

```typescript
function checkMarkupErrors(): ValidationResult[];
```

- **검사 대상**: HTML 구조 전체
- **검증 내용**:
    - 중복 `id` 속성 검사
    - 닫지 않은 태그 검사
    - 잘못된 중첩 구조 검사

---

## Phase 6: 신규 KWCAG 2.2 항목 완성 (v2.0.0)

### 🆕 KWCAG 2.2 신규 추가 항목

#### 1. 6.1.4 문자 단축키

```typescript
function checkCharacterShortcuts(): ValidationResult[];
```

- **검사 대상**: 키보드 단축키 구현
- **검증 내용**:
    - 단일 문자 키 단축키 비활성화/재정의 옵션

#### 2. 6.2.2 정지 기능 제공

```typescript
function checkPauseControl(): ValidationResult[];
```

- **검사 대상**: 자동 움직이는 콘텐츠
- **검증 내용**:
    - 5초 이상 움직이는 콘텐츠의 정지/숨김 기능

#### 3. 6.5.3 레이블과 네임

```typescript
function checkLabelAndName(): ValidationResult[];
```

- **검사 대상**: 사용자 인터페이스 컴포넌트
- **검증 내용**:
    - 접근가능한 이름과 시각적 레이블의 일치성

#### 4. 7.2.2 찾기 쉬운 도움 정보

```typescript
function checkHelpInfo(): ValidationResult[];
```

- **검사 대상**: 도움말, 연락처 정보
- **검증 내용**:
    - 일관된 위치의 도움 정보 제공

#### 5. 7.3.4 반복 입력 정보

```typescript
function checkRedundantEntry(): ValidationResult[];
```

- **검사 대상**: 다단계 폼 프로세스
- **검증 내용**:
    - 이전 단계에서 입력한 정보 재사용 가능성

#### 6. 5.4.4 콘텐츠 간의 구분

```typescript
function checkContentSeparation(): ValidationResult[];
```

- **검사 대상**: 인접한 UI 컴포넌트
- **검증 내용**:
    - 시각적으로 구분 가능한 경계선 제공

---

## 개발 우선순위 및 일정

### 🎯 Phase 1: 현재 기능 안정화

- [x] 이미지 검사 고도화
- [x] 테이블 검사 확장
- [x] ARIA 지원 확대
- [ ] 키보드 접근성 강화

### 🚀 Phase 2: 핵심 누락 항목

- [ ] 키보드 사용 보장 (6.1.1)
- [ ] 색상 독립성 (5.4.1)
- [ ] 명도 대비 (5.4.3)
- [ ] 링크 텍스트 (6.4.3)
- [ ] 오류 정정 (7.3.1)

### 🎬 Phase 3: 멀티미디어

- [ ] 자막 제공 (5.2.1)
- [ ] 자동재생 금지 (5.4.2)
- [ ] 응답시간 조절 (6.2.1)
- [ ] 깜빡임 제한 (6.3.1)

### 📱 Phase 4: 모바일 지원

- [ ] 조작 가능 (6.1.3)
- [ ] 포인터 입력 지원 (6.5.1-6.5.2, 6.5.4)

### 🏗️ Phase 5: 고급 구조

- [ ] 선형구조 (5.3.2)
- [ ] 명확한 지시사항 (5.3.3)
- [ ] 일관된 위치 (6.4.4)
- [ ] 접근 가능한 인증 (7.3.3)
- [ ] 마크업 오류 (8.1.1)

### 🆕 Phase 6: KWCAG 2.2 완성

- [ ] 신규 6개 항목 구현
- [ ] 전체 통합 테스트
- [ ] 성능 최적화

---

## 기술적 고려사항

### 📊 성능 최적화

- **선택적 검사**: 필요한 항목만 실행하는 옵션
- **점진적 검사**: 대용량 페이지의 배치 처리
- **캐싱 시스템**: 반복 검사 결과 캐싱
- **Web Worker**: 무거운 검사의 백그라운드 처리

### 🔧 기술 스택 확장

- **색상 분석**: Color contrast 계산 라이브러리
- **CSS 분석**: PostCSS를 통한 스타일 분석
- **DOM 분석**: MutationObserver를 통한 동적 변경 감지
- **Image 처리**: Canvas API를 통한 이미지 분석

### 🧪 테스팅 전략

- **단위 테스트**: 각 검사 함수별 comprehensive test
- **통합 테스트**: 실제 웹사이트 대상 E2E 테스트
- **성능 테스트**: 대용량 페이지 처리 성능 측정
- **브라우저 호환성**: 크로스 브라우저 테스트 자동화

### 📚 문서화 확장

- **API 참조 문서**: 모든 함수의 상세 사양
- **검사 기준 가이드**: 각 항목별 Pass/Warning/Fail 기준
- **통합 가이드**: 다양한 프레임워크 통합 방법
- **모범 사례**: 실제 웹사이트 개선 사례

---

## 목표 달성 지표

### 📈 커버리지 목표

- **v1.1.0**: 11개 → 12개 (36%)
- **v1.2.0**: 12개 → 17개 (52%)
- **v1.3.0**: 17개 → 21개 (64%)
- **v1.4.0**: 21개 → 25개 (76%)
- **v1.5.0**: 25개 → 30개 (91%)
- **v2.0.0**: 30개 → 33개 (100%) ✅

### 🎯 품질 목표

- **테스트 커버리지**: 95% 이상 유지
- **성능**: 1000개 요소 페이지 1초 이내 검사
- **정확도**: False positive < 5%
- **문서화**: 모든 검사 항목 완전 문서화
