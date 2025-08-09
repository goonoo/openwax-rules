# OpenWAX Rules 사용 예시

OpenWAX Rules를 실제 프로젝트에서 활용하는 방법을 설명합니다.

## 기본 사용법

### 설치

```bash
npm install openwax-rules
```

### 기본 검사 실행

```typescript
import { checkImages, checkTables, checkInputLabels, checkWebApplication } from "openwax-rules";

// 페이지가 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
    // 이미지 접근성 검사
    const imageResults = checkImages();
    console.log("이미지 검사 결과:", imageResults);

    // 표 접근성 검사
    const tableResults = checkTables();
    console.log("표 검사 결과:", tableResults);

    // 폼 라벨 검사
    const labelResults = checkInputLabels();
    console.log("라벨 검사 결과:", labelResults);

    // ARIA 인터페이스 검사
    const ariaResults = checkWebApplication();
    console.log("ARIA 검사 결과:", ariaResults);
});
```

## 검사 결과 활용

### 1. 문제점 필터링 및 표시

```typescript
function displayAccessibilityIssues() {
    const imageResults = checkImages();

    // 실패한 항목만 필터링
    const failedImages = imageResults.filter((result) => result.valid === "fail");

    // 경고 항목 포함
    const issuesWithWarnings = imageResults.filter((result) => result.valid === "fail" || result.valid === "warning");

    console.log(`이미지 접근성 문제: ${failedImages.length}개`);
    console.log(`개선 권장사항: ${issuesWithWarnings.length}개`);

    // 구체적인 문제점 출력
    failedImages.forEach((result, index) => {
        console.log(`${index + 1}. ${result.element.tagName} 요소:`);
        if (result.issues) {
            result.issues.forEach((issue) => console.log(`   - ${issue}`));
        }
    });
}
```

### 2. 접근성 대시보드 구현

```typescript
function createAccessibilityReport() {
    const report = {
        images: checkImages(),
        tables: checkTables(),
        labels: checkInputLabels(),
        webApp: checkWebApplication(),
        focus: checkFocus(),
        skipNav: checkSkipNav(),
        pageTitle: checkPageTitle(),
        frames: checkFrames(),
        pageLang: checkPageLang(),
        userRequest: checkUserRequest(),
    };

    // 전체 통계 계산
    const stats = Object.entries(report).reduce((acc, [key, results]) => {
        const resultArray = Array.isArray(results) ? results : [results];

        acc[key] = {
            total: resultArray.length,
            pass: resultArray.filter((r) => r.valid === "pass").length,
            warning: resultArray.filter((r) => r.valid === "warning").length,
            fail: resultArray.filter((r) => r.valid === "fail").length,
        };

        return acc;
    }, {});

    console.log("📊 접근성 검사 통계:", stats);
    return { report, stats };
}
```

### 3. 실시간 검사 (MutationObserver 활용)

```typescript
class AccessibilityMonitor {
    private observer: MutationObserver;

    constructor() {
        this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    start() {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["alt", "aria-label", "aria-labelledby", "scope"],
        });

        console.log("🔍 실시간 접근성 모니터링 시작");
    }

    private handleMutations(mutations: MutationRecord[]) {
        let shouldRecheck = false;

        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                // 새로운 요소가 추가된 경우
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        if (element.matches("img, table, input, [role]")) {
                            shouldRecheck = true;
                        }
                    }
                });
            } else if (mutation.type === "attributes") {
                // 접근성 관련 속성이 변경된 경우
                shouldRecheck = true;
            }
        });

        if (shouldRecheck) {
            console.log("🔄 DOM 변경 감지, 재검사 실행");
            this.performChecks();
        }
    }

    private performChecks() {
        // 필요한 검사만 선택적으로 실행
        const imageResults = checkImages();
        const tableResults = checkTables();

        // 문제가 있는 경우만 알림
        const issues = [...imageResults, ...tableResults].filter((result) => result.valid === "fail");

        if (issues.length > 0) {
            console.warn(`⚠️ 접근성 문제 ${issues.length}개 발견`);
        }
    }

    stop() {
        this.observer.disconnect();
        console.log("⏹️ 실시간 모니터링 중지");
    }
}

// 사용법
const monitor = new AccessibilityMonitor();
monitor.start();
```

## 개발 워크플로우 통합

### 1. 빌드 시점 검사

```javascript
// webpack.config.js 또는 별도 스크립트
const { JSDOM } = require("jsdom");
const fs = require("fs");

async function checkBuiltFiles() {
    const htmlFiles = glob.sync("dist/**/*.html");

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, "utf8");
        const dom = new JSDOM(html);
        global.document = dom.window.document;
        global.window = dom.window;

        // OpenWAX Rules 검사 실행
        const { checkImages, checkTables } = require("openwax-rules");
        const imageResults = checkImages();
        const tableResults = checkTables();

        const errors = [...imageResults, ...tableResults].filter((r) => r.valid === "fail");

        if (errors.length > 0) {
            console.error(`❌ ${file}: 접근성 오류 ${errors.length}개`);
            errors.forEach((error) => {
                console.error(`   ${error.element.tagName}: ${error.issues?.join(", ")}`);
            });
        } else {
            console.log(`✅ ${file}: 접근성 검사 통과`);
        }
    }
}
```

### 2. 테스트 자동화

```typescript
// cypress/integration/accessibility.spec.ts
describe("접근성 검사", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.window().then((win) => {
            // OpenWAX Rules를 window 객체에 추가
            win.OpenWAXRules = require("openwax-rules");
        });
    });

    it("이미지 접근성을 만족해야 한다", () => {
        cy.window().then((win) => {
            const results = win.OpenWAXRules.checkImages();
            const failures = results.filter((r) => r.valid === "fail");

            expect(failures).to.have.length(0, `이미지 접근성 오류: ${failures.length}개`);
        });
    });

    it("표 구조가 올바르게 구성되어야 한다", () => {
        cy.window().then((win) => {
            const results = win.OpenWAXRules.checkTables();
            const failures = results.filter((r) => r.valid === "fail");

            expect(failures).to.have.length(0, `표 접근성 오류: ${failures.length}개`);
        });
    });
});
```

### 3. 브라우저 확장 개발

```typescript
// content_script.ts
class AccessibilityChecker {
    private isEnabled = false;
    private overlay: HTMLElement | null = null;

    toggle() {
        this.isEnabled = !this.isEnabled;

        if (this.isEnabled) {
            this.runChecks();
            this.showOverlay();
        } else {
            this.hideOverlay();
        }
    }

    private runChecks() {
        const allResults = [...checkImages(), ...checkTables(), ...checkInputLabels(), ...checkWebApplication()].flat();

        // 문제가 있는 요소들에 하이라이트 표시
        allResults
            .filter((result) => result.valid === "fail")
            .forEach((result) => {
                if (result.element) {
                    this.highlightElement(result.element, "error");
                }
            });

        allResults
            .filter((result) => result.valid === "warning")
            .forEach((result) => {
                if (result.element) {
                    this.highlightElement(result.element, "warning");
                }
            });
    }

    private highlightElement(element: Element, type: "error" | "warning") {
        element.style.outline = type === "error" ? "3px solid red" : "3px solid orange";

        // 툴팁 추가
        element.setAttribute("title", `접근성 ${type === "error" ? "오류" : "경고"} 발견`);
    }

    private showOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: white;
      border: 1px solid #ccc;
      padding: 10px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
        this.overlay.innerHTML = `
      <h3>접근성 검사 활성화</h3>
      <p>🔴 빨간 테두리: 오류</p>
      <p>🟠 주황 테두리: 경고</p>
      <button onclick="this.parentElement.remove()">닫기</button>
    `;

        document.body.appendChild(this.overlay);
    }

    private hideOverlay() {
        // 하이라이트 제거
        document.querySelectorAll("*").forEach((el) => {
            (el as HTMLElement).style.outline = "";
            el.removeAttribute("title");
        });

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// 전역에서 사용 가능하도록 설정
(window as any).accessibilityChecker = new AccessibilityChecker();
```

## 프레임워크별 통합

### React 컴포넌트

```tsx
import React, { useEffect, useState } from "react";
import { checkImages, checkTables } from "openwax-rules";

interface AccessibilityPanelProps {
    enabled: boolean;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ enabled }) => {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (!enabled) return;

        const runChecks = () => {
            const imageResults = checkImages();
            const tableResults = checkTables();

            setResults([...imageResults, ...tableResults]);
        };

        runChecks();

        // 주기적 검사 (개발 환경에서만)
        const interval = setInterval(runChecks, 5000);
        return () => clearInterval(interval);
    }, [enabled]);

    if (!enabled) return null;

    const issues = results.filter((r) => r.valid === "fail" || r.valid === "warning");

    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                background: "white",
                border: "1px solid #ccc",
                padding: "1rem",
                maxWidth: "300px",
                maxHeight: "200px",
                overflow: "auto",
                zIndex: 9999,
            }}
        >
            <h4>접근성 검사 ({issues.length})</h4>
            {issues.map((issue, index) => (
                <div
                    key={index}
                    style={{
                        color: issue.valid === "fail" ? "red" : "orange",
                        fontSize: "0.8rem",
                        marginBottom: "0.5rem",
                    }}
                >
                    {issue.element?.tagName}: {issue.issues?.join(", ")}
                </div>
            ))}
        </div>
    );
};
```

### Vue.js 플러그인

```typescript
// accessibility-plugin.ts
import { App } from "vue";
import * as OpenWAXRules from "openwax-rules";

export default {
    install(app: App) {
        app.config.globalProperties.$accessibility = {
            checkAll() {
                return {
                    images: OpenWAXRules.checkImages(),
                    tables: OpenWAXRules.checkTables(),
                    labels: OpenWAXRules.checkInputLabels(),
                    webApp: OpenWAXRules.checkWebApplication(),
                };
            },

            checkImages: OpenWAXRules.checkImages,
            checkTables: OpenWAXRules.checkTables,
            checkInputLabels: OpenWAXRules.checkInputLabels,
            checkWebApplication: OpenWAXRules.checkWebApplication,
        };

        // 개발 모드에서만 자동 검사
        if (process.env.NODE_ENV === "development") {
            app.mixin({
                mounted() {
                    this.$nextTick(() => {
                        const results = this.$accessibility.checkAll();
                        const issues = Object.values(results)
                            .flat()
                            .filter((r) => r.valid === "fail");

                        if (issues.length > 0) {
                            console.warn(`⚠️ 접근성 문제 ${issues.length}개 발견`);
                        }
                    });
                },
            });
        }
    },
};

// main.ts
import { createApp } from "vue";
import AccessibilityPlugin from "./accessibility-plugin";

const app = createApp(App);
app.use(AccessibilityPlugin);
```

## 성능 최적화

### 1. 선택적 검사

```typescript
// 필요한 검사만 실행
function performTargetedCheck(target: "images" | "tables" | "forms" | "aria") {
    switch (target) {
        case "images":
            return checkImages();
        case "tables":
            return checkTables();
        case "forms":
            return checkInputLabels();
        case "aria":
            return checkWebApplication();
    }
}

// 변경된 영역만 검사
function checkChangedArea(container: Element) {
    const images = Array.from(container.querySelectorAll("img")).map((img) => ({
        element: img,
        // ... 검사 로직
    }));

    return images;
}
```

### 2. 디바운스 적용

```typescript
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

const debouncedCheck = debounce(() => {
    const results = checkImages();
    console.log("검사 완료:", results.length);
}, 1000);

// DOM 변경 시 디바운스된 검사 실행
document.addEventListener("DOMContentLoaded", debouncedCheck);
```

이 예시들을 통해 OpenWAX Rules를 실제 개발 워크플로우에 효과적으로 통합할 수 있습니다.
