# OpenWAX Rules

한국형 웹 콘텐츠 접근성 지침(KWAG) 2.2를 기반으로 한 웹 접근성 검사 규칙 라이브러리입니다.

## 설치

```bash
npm install openwax-rules
```

## 사용법

```typescript
import {
  checkImages,
  checkTables,
  checkFocus,
  checkPageTitle,
  checkWebApplication
} from 'openwax-rules';

// 이미지 접근성 검사
const imageResults = checkImages();

// 테이블 접근성 검사
const tableResults = checkTables();

// 초점 이동과 표시 검사
const focusResults = checkFocus();

// 페이지 제목 검사
const titleResult = checkPageTitle();

// 웹 애플리케이션 접근성 검사
const webAppResults = checkWebApplication();
```

## 지원하는 검사 항목

- **5.1.1 적절한 대체 텍스트 제공**: 이미지와 배경 이미지의 대체 텍스트 검사
- **5.3.1 표의 구성**: 테이블의 구조와 접근성 검사
- **6.1.2 초점 이동과 표시**: 키보드 초점 관리 검사
- **6.4.1 반복 영역 건너뛰기**: 스킵 네비게이션 검사
- **6.4.2 제목 제공**: 페이지, 프레임, 콘텐츠 블록의 제목 검사
- **7.1.1 기본 언어 표시**: 페이지 언어 설정 검사
- **7.2.1 사용자 요청에 의한 새창/팝업**: 새창/팝업 접근성 검사
- **7.3.2 레이블 제공**: 입력 요소의 레이블 검사
- **8.2.1 웹 애플리케이션 접근성 준수**: ARIA 역할 기반 인터페이스 검사

## 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 테스트
npm test

# 린트
npm run lint
```

## 라이선스

MIT License


