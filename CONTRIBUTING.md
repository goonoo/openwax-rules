# 기여 가이드라인

OpenWAX Rules 프로젝트에 기여해주셔서 감사합니다!

## 개발 환경 설정

1. 저장소를 포크하고 클론합니다

```bash
git clone https://github.com/YOUR_USERNAME/openwax-rules.git
cd openwax-rules
```

2. 의존성을 설치합니다

```bash
npm install
```

3. 개발 서버를 시작합니다

```bash
npm run start:dev
```

## 개발 워크플로우

1. 새로운 브랜치를 생성합니다

```bash
git checkout -b feature/your-feature-name
```

2. 변경사항을 커밋합니다

```bash
git add .
git commit -m "feat: add new accessibility rule"
```

3. 브랜치를 푸시합니다

```bash
git push origin feature/your-feature-name
```

4. Pull Request를 생성합니다

## 코딩 스타일

- TypeScript를 사용합니다
- ESLint와 Prettier 규칙을 따릅니다
- 함수와 변수명은 camelCase를 사용합니다
- 클래스명은 PascalCase를 사용합니다
- 주석은 한국어로 작성합니다

## 테스트

- 새로운 기능을 추가할 때는 테스트도 함께 작성해주세요
- 기존 테스트가 모두 통과하는지 확인해주세요

```bash
npm test
```

## 린트

- 코드를 커밋하기 전에 린트를 실행해주세요

```bash
npm run lint
```

## 커밋 메시지

커밋 메시지는 다음 형식을 따릅니다:

- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 스타일 변경
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가/수정
- `chore:` 빌드 프로세스 또는 보조 도구 변경

## Pull Request

PR을 생성할 때 다음 사항을 확인해주세요:

- [ ] 모든 테스트가 통과합니다
- [ ] 린트 검사를 통과합니다
- [ ] 코드 리뷰를 받았습니다
- [ ] 문서를 업데이트했습니다 (필요한 경우)

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
