/* eslint-env browser */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * 5.1.1 적절한 대체 텍스트 제공 (img) 검사
 * 개선사항: longdesc 지원, SVG 검증, 이미지맵 강화
 */
export function checkImages() {
  const images = Array.from(
    document.querySelectorAll('img, input[type="image"], area, svg'),
  );
  const baseUrl = window.location.href;

  // 무의미한 alt 텍스트 패턴
  const meaninglessAltPatterns = [
    /^image$/i,
    /^img$/i,
    /^picture$/i,
    /^photo$/i,
    /^그림$/i,
    /^이미지$/i,
    /^사진$/i,
    /^icon$/i,
    /^아이콘$/i,
    /^banner$/i,
    /^배너$/i,
    /^logo$/i,
    /^로고$/i,
    /^untitled$/i,
    /^제목없음$/i,
    /^\d+\.(jpg|jpeg|png|gif|webp)$/i,
    /^[a-z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i,
  ];

  return images.map((img) => {
    const tagName = img.tagName.toLowerCase();
    const src = img.getAttribute('src') || '';
    let absoluteSrc = '';
    try {
      absoluteSrc = new URL(src, baseUrl).href;
    } catch {
      absoluteSrc = src;
    }

    const style = window.getComputedStyle(img);
    const visible =
      img.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';

    const alt = img.getAttribute('alt');
    const longdesc = img.getAttribute('longdesc');

    // SVG 전용 접근성 요소 검사
    let svgTitle = '';
    let svgDesc = '';
    if (tagName === 'svg') {
      const titleElement = img.querySelector('title');
      const descElement = img.querySelector('desc');
      svgTitle = titleElement ? titleElement.textContent?.trim() || '' : '';
      svgDesc = descElement ? descElement.textContent?.trim() || '' : '';
    }

    // 이미지맵 area 요소의 특별 처리
    let isImageMapArea = false;
    let imageMapParent = null;
    if (tagName === 'area') {
      isImageMapArea = true;
      const mapElement = img.closest('map');
      if (mapElement) {
        const mapName = mapElement.getAttribute('name');
        imageMapParent = document.querySelector(`img[usemap="#${mapName}"]`);
      }
    }

    // 이미지 용도 분류
    const isInteractive = !!(
      img.closest('a, button, [role="button"]') ||
      img.hasAttribute('onclick') ||
      img.style.cursor === 'pointer'
    );

    const isDecorative = !!(
      img.getAttribute('role') === 'presentation' ||
      img.getAttribute('role') === 'none'
    );

    const hasMeaninglessAlt = alt && meaninglessAltPatterns.some(pattern => pattern.test(alt.trim()));

    // 검증 로직
    let valid: 'pass' | 'warning' | 'fail' = 'pass';
    const issues: string[] = [];

    // SVG 이미지 특별 검증
    if (tagName === 'svg') {
      const hasAccessibleName = !!(alt || svgTitle || img.getAttribute('aria-label') || img.getAttribute('aria-labelledby'));
      const isDecorativeSvg = img.getAttribute('role') === 'img' || img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true';
      
      if (!isDecorativeSvg && !hasAccessibleName) {
        valid = 'fail';
        issues.push('SVG에 접근 가능한 이름이 없음 - <title>, alt, aria-label 중 하나 필요');
      } else if (svgTitle && svgDesc) {
        // 복잡한 SVG에는 title과 desc 모두 권장
        if (valid !== 'fail') valid = 'pass';
      } else if (hasAccessibleName && !isDecorativeSvg) {
        if (valid !== 'fail') valid = 'pass';
      }
    }
    // 이미지맵 area 특별 검증
    else if (isImageMapArea) {
      if (alt === null) {
        valid = 'fail';
        issues.push('이미지맵 영역에 alt 속성이 없음');
      } else if (alt === '') {
        valid = 'fail';
        issues.push('이미지맵 영역의 alt가 비어있음 - 해당 영역의 목적지나 기능을 설명해야 함');
      } else if (hasMeaninglessAlt) {
        valid = 'warning';
        issues.push('이미지맵 영역의 alt가 무의미함 - 링크 목적지나 기능을 명확히 설명 필요');
      }
    }
    // 일반 이미지 검증 (기존 로직 + longdesc 지원)
    else {
      if (alt === null) {
        // alt 속성이 없음
        valid = 'fail';
        issues.push('alt 속성이 없음');
      } else if (isInteractive) {
        // 상호작용 이미지는 엄격한 검증
        if (alt === '') {
          valid = 'fail';
          issues.push('상호작용 이미지의 alt가 비어있음');
        } else if (hasMeaninglessAlt) {
          valid = 'fail';
          issues.push('상호작용 이미지의 alt가 무의미함');
        }
      } else if (isDecorative) {
        // 명시적으로 장식적으로 표시된 이미지
        if (alt !== '') {
          valid = 'warning';
          issues.push('장식적 이미지에 불필요한 alt 텍스트');
        }
      } else if (alt === '') {
        // 일반 이미지에서 빈 alt는 기존 로직 유지 (warning)
        valid = 'warning';
        issues.push('alt가 비어있음 - 장식적이라면 role="presentation" 추가, 의미가 있다면 적절한 대체 텍스트 필요');
      } else if (hasMeaninglessAlt) {
        // 무의미한 alt 텍스트
        valid = 'warning';
        issues.push('무의미한 alt 텍스트 - 이미지의 목적과 내용을 설명하는 텍스트 필요');
      }

      // longdesc 검증 (복잡한 이미지용)
      if (longdesc) {
        try {
          const longdescUrl = new URL(longdesc, baseUrl);
          // longdesc 링크가 유효한지 확인은 실제로는 네트워크 요청이 필요하므로 
          // 여기서는 URL 형식만 검증
          if (longdescUrl.href) {
            // longdesc가 있으면 복잡한 이미지로 간주하여 좋은 사례로 평가
            issues.push('복잡한 이미지에 대한 상세 설명 제공됨 (longdesc)');
          }
        } catch {
          // URL이 올바르지 않더라도 기존 valid 상태를 변경하지 않고 warning으로만 처리
          if (valid === 'pass') {
            valid = 'warning';
          }
          issues.push('longdesc URL이 올바르지 않음');
        }
      }
    }

    return {
      element: img,
      tagName,
      hidden: !visible,
      src: absoluteSrc,
      alt,
      longdesc,
      valid,
      issues,
      isInteractive,
      isDecorative,
      hasMeaninglessAlt,
      // 새로운 필드들
      svgTitle,
      svgDesc,
      isImageMapArea,
      imageMapParent,
    };
  });
}

/**
 * 5.1.1 적절한 대체 텍스트 제공 (bg) 검사
 */
export function checkBgImages() {
  const elements = Array.from(document.querySelectorAll('*'));
  const baseUrl = window.location.href;

  return elements
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundImage !== 'none';
    })
    .map((el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      const urlMatch = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
      const src = urlMatch ? urlMatch[1] : '';
      let absoluteSrc = '';
      try {
        absoluteSrc = new URL(src, baseUrl).href;
      } catch {
        absoluteSrc = src;
      }
      
      const visible =
        el.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      
      // 대체 텍스트 확인
      const hasAltText = !!(el.getAttribute('aria-label') || el.getAttribute('title'));
      
      // 상호작용 요소인지 확인
      const isInteractive = !!(
        el.closest('button, a, [role="button"]') || 
        el.hasAttribute('tabindex') ||
        el.getAttribute('role') === 'button'
      );
      
      let valid: 'pass' | 'warning' | 'fail';
      const issues: string[] = [];
      
      if (isInteractive && !hasAltText) {
        // 상호작용 요소는 더 엄격하게
        valid = 'fail';
        issues.push('상호작용 요소의 배경 이미지에 대체 텍스트가 없음');
      } else if (!hasAltText) {
        // 일반적인 경우는 경고로
        valid = 'warning';  
        issues.push('배경 이미지에 대체 텍스트가 없음 - 의미가 있다면 aria-label 또는 title 추가');
      } else {
        valid = 'pass';
      }

      return {
        element: el,
        hidden: !visible,
        src: absoluteSrc,
        alt: el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim() || '',
        valid,
        issues,
        isInteractive,
      };
    });
}

/**
 * 5.3.1 표의 구성 검사
 * 개선사항: headers-id 연결, colspan/rowspan, 레이아웃 테이블 감지, summary 검증
 */
export function checkTables() {
  return Array.from(document.querySelectorAll('table')).map((table) => {
    const caption = table.querySelector('caption')?.textContent?.trim() || '';
    const summary = table.getAttribute('summary') || '';
    const ariaLabel = table.getAttribute('aria-label') || '';
    const ariaLabelledBy = table.getAttribute('aria-labelledby') || '';
    const thead = table.querySelector('thead');
    const tfoot = table.querySelector('tfoot');
    const tbody = table.querySelector('tbody');
    const role = table.getAttribute('role');

    // 표 라벨 우선순위: aria-labelledby > aria-label > caption > summary
    function getTableLabel() {
      if (ariaLabelledBy) {
        const labelElement = document.getElementById(ariaLabelledBy);
        const labelText = labelElement?.textContent?.trim();
        if (labelText) {
          return labelText;
        }
        // aria-labelledby가 참조하는 요소가 없거나 빈 텍스트면 다음 우선순위로
      }
      if (ariaLabel) {
        return ariaLabel.trim();
      }
      if (caption) {
        return caption;
      }
      return summary;
    }

    function extractCells(section) {
      if (!section) return [];
      return Array.from(section.querySelectorAll('tr')).map((tr, rowIndex) => {
        return Array.from(tr.children).map((cell, cellIndex) => {
          return {
            tag: cell.tagName.toLowerCase(),
            text: cell.textContent?.trim() || '',
            scope: cell.getAttribute('scope') || '',
            // 새로운 확장 정보
            id: cell.getAttribute('id') || '',
            headers: cell.getAttribute('headers') || '',
            colspan: parseInt(cell.getAttribute('colspan') || '1'),
            rowspan: parseInt(cell.getAttribute('rowspan') || '1'),
            position: { row: rowIndex, cell: cellIndex },
          };
        });
      });
    }

    const tableLabel = getTableLabel();
    const hasAnyLabel = !!(tableLabel);

    // 추가 분석 함수들
    function analyzeHeadersIdConnections() {
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      
      const issues = [];
      const cellsWithHeaders = allCells.filter(cell => cell.headers);
      const cellsWithId = allCells.filter(cell => cell.id);
      const idMap = new Map(cellsWithId.map(cell => [cell.id, cell]));
      
      // headers 속성을 가진 셀들의 참조 검증
      cellsWithHeaders.forEach(cell => {
        const headerIds = cell.headers.split(/\s+/).filter(id => id);
        headerIds.forEach(headerId => {
          const referencedCell = idMap.get(headerId);
          if (!referencedCell) {
            issues.push(`headers="${cell.headers}"가 존재하지 않는 id "${headerId}"를 참조함`);
          } else if (referencedCell.tag !== 'th') {
            issues.push(`headers="${cell.headers}"가 th가 아닌 ${referencedCell.tag}를 참조함`);
          }
        });
      });
      
      return {
        hasHeadersIdConnections: cellsWithHeaders.length > 0,
        headerConnectionIssues: issues,
        cellsWithHeaders: cellsWithHeaders.length,
        cellsWithId: cellsWithId.length,
      };
    }

    function analyzeSpannedCells() {
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      
      const spannedCells = allCells.filter(cell => cell.colspan > 1 || cell.rowspan > 1);
      const issues = [];
      
      // colspan/rowspan을 사용하는 셀들의 접근성 검증
      spannedCells.forEach(cell => {
        if (cell.tag === 'th' && !cell.scope && !cell.id) {
          issues.push(`${cell.colspan > 1 ? 'colspan' : 'rowspan'} 사용하는 th에 scope 또는 id 권장`);
        }
        if (cell.tag === 'td' && (cell.colspan > 1 || cell.rowspan > 1) && !cell.headers) {
          // 복잡한 구조의 td는 headers 속성으로 명시적 연결 권장
          if (spannedCells.length > 2) { // 복잡한 경우만
            issues.push(`복잡한 표에서 span 사용하는 td에 headers 속성 권장`);
          }
        }
      });
      
      return {
        hasSpannedCells: spannedCells.length > 0,
        spannedCells: spannedCells.length,
        spanIssues: issues,
      };
    }

    function detectLayoutTable() {
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      
      // 레이아웃 테이블 감지 휴리스틱
      const hasTh = allCells.some(cell => cell.tag === 'th');
      const hasNumericData = allCells.some(cell => /^\d+(\.\d+)?$/.test(cell.text));
      const hasFormControls = !!table.querySelector('input, button, select, textarea');
      const rowCount = allCells.length / Math.max(1, allCells.filter((_, i) => i === 0 || allCells[i].position.row > allCells[i-1].position.row).length);
      
      let layoutTableScore = 0;
      
      // 레이아웃 테이블 지표들
      if (!hasTh) layoutTableScore += 2; // th 없음
      if (hasFormControls) layoutTableScore += 2; // 폼 컨트롤 포함
      if (rowCount <= 2) layoutTableScore += 1; // 행이 적음
      if (!hasNumericData && !caption && !summary) layoutTableScore += 1; // 데이터성 콘텐츠 없음
      if (role === 'presentation') layoutTableScore += 3; // 명시적 presentation
      
      // 데이터 테이블 지표들 (점수 감소)
      if (caption) layoutTableScore -= 2; // caption이 있으면 데이터 테이블 가능성 높음
      if (summary) layoutTableScore -= 1; // summary가 있으면 데이터 테이블 가능성 높음
      if (hasNumericData) layoutTableScore -= 1; // 숫자 데이터가 있으면 데이터 테이블
      
      return {
        isLikelyLayoutTable: layoutTableScore >= 3,
        layoutScore: layoutTableScore,
        indicators: {
          noTh: !hasTh,
          hasFormControls,
          fewRows: rowCount <= 2,
          noDataLike: !hasNumericData,
          presentationRole: role === 'presentation',
        },
      };
    }

    // 분석 실행
    const headersIdAnalysis = analyzeHeadersIdConnections();
    const spanAnalysis = analyzeSpannedCells();
    const layoutAnalysis = detectLayoutTable();

    // valid 판정 로직 (확장된 검증 포함)
    let valid = 'fail';
    const issues: string[] = [];
    
    // headers-id 연결 검증 오류 추가
    issues.push(...headersIdAnalysis.headerConnectionIssues);
    
    if (role === 'presentation' || layoutAnalysis.isLikelyLayoutTable) {
      valid = 'warning';
      if (hasAnyLabel && !layoutAnalysis.indicators.presentationRole) {
        issues.push('레이아웃 테이블로 보이는데 라벨이 있음 - role="presentation" 추가 권장');
      } else if (hasAnyLabel && layoutAnalysis.indicators.presentationRole) {
        issues.push('레이아웃 테이블에 불필요한 라벨이 있음');
      }
      if (layoutAnalysis.isLikelyLayoutTable && !layoutAnalysis.indicators.presentationRole) {
        issues.push('레이아웃 목적으로 보임 - CSS Grid/Flexbox 사용 권장');
      }
    } else {
      // thead, tbody, tfoot 전체에서 scope 있는 th가 하나라도 있고, 라벨이 있어야 pass
      const allCells = [
        extractCells(thead),
        extractCells(tbody),
        extractCells(tfoot),
      ].flat(2);
      const hasTh = allCells.some((cell) => cell.tag === 'th');
      const hasScopeTh = allCells.some(
        (cell) => cell.tag === 'th' && cell.scope,
      );

      if (!hasTh) {
        valid = 'fail';
        issues.push('제목 셀(th)이 없음');
      } else if (hasAnyLabel && (hasScopeTh || headersIdAnalysis.hasHeadersIdConnections)) {
        // scope가 있거나 headers-id 연결이 있으면 pass
        valid = 'pass';
        
        // 복잡한 테이블에 대한 추가 권장사항
        if (spanAnalysis.hasSpannedCells && !headersIdAnalysis.hasHeadersIdConnections) {
          if (spanAnalysis.spannedCells > 2) {
            issues.push('복잡한 표 구조 - headers-id 연결 방식 권장');
          }
        }
      } else if (hasAnyLabel && hasTh) {
        valid = 'warning';
        issues.push('scope 속성 추가 권장');
      } else if (!hasAnyLabel && hasTh) {
        valid = 'warning';
        issues.push('표 라벨 추가 권장 (caption, aria-label, aria-labelledby)');
      } else if (!hasAnyLabel && !hasTh) {
        valid = 'fail';
        issues.push('데이터 테이블이라면 th와 라벨 모두 필요');
      }
      
      // colspan/rowspan 관련 권장사항 추가
      if (spanAnalysis.spanIssues.length > 0) {
        issues.push(...spanAnalysis.spanIssues);
      }
    }
    
    // summary 속성 검증 (HTML5에서는 deprecated이지만 여전히 사용되는 경우)
    if (summary) {
      issues.push('summary는 deprecated - caption이나 aria-label 사용 권장');
    }

    const style = window.getComputedStyle(table);
    const visible =
      table.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';

    return {
      element: table,
      hidden: !visible,
      caption,
      summary,
      ariaLabel,
      ariaLabelledBy,
      tableLabel,
      hasAnyLabel,
      thead: !!thead,
      tfoot: !!tfoot,
      tbody: !!tbody,
      theadCells: extractCells(thead),
      tfootCells: extractCells(tfoot),
      tbodyCells: extractCells(tbody),
      valid,
      issues,
      // 새로운 확장 정보
      headersIdAnalysis,
      spanAnalysis,
      layoutAnalysis,
      role,
    };
  });
}

/**
 * 6.1.2 초점 이동과 표시
 */
export function checkFocus() {
  const focusableElements = Array.from(document.querySelectorAll('*'));

  return focusableElements
    .map((element) => {
      const style = window.getComputedStyle(element);
      // jsdom에서는 offsetParent가 항상 null이므로, 스타일로만 판단
      const isVisible =
        style.visibility !== 'hidden' && style.display !== 'none';

      if (!isVisible) {
        return null; // 숨겨진 요소는 검사하지 않음
      }

      let hasBlurEvent = false;
      let hasOutlineZero = false;
      let issueType = '';
      let issueValue = '';

      // 1. blur() 이벤트 확인
      const onfocus = element.getAttribute('onfocus');
      const onclick = element.getAttribute('onclick');

      if (onfocus && onfocus.includes('blur()')) {
        hasBlurEvent = true;
        issueType = 'blur()';
        issueValue = onfocus;
      } else if (onclick && onclick.includes('blur()')) {
        hasBlurEvent = true;
        issueType = 'blur()';
        issueValue = onclick;
      }

      // 2. outline:0 스타일 확인
      const outlineWidth = element.style.getPropertyValue('outline-width');
      const outlineStyle = element.style.getPropertyValue('outline-style');

      if (outlineWidth === '0px' || outlineWidth === '0') {
        hasOutlineZero = true;
        if (!hasBlurEvent) {
          issueType = 'outline:0';
          issueValue = `outline-width: ${outlineWidth}, outline-style: ${outlineStyle}`;
        }
      }

      // 3. CSS에서 outline 제거 확인
      const cssText = element.style.cssText || '';
      if (
        cssText.includes('outline: none') ||
        cssText.includes('outline: 0') ||
        cssText.includes('outline-width: 0')
      ) {
        hasOutlineZero = true;
        if (!hasBlurEvent) {
          issueType = 'outline:0';
          issueValue = cssText;
        }
      }
      const visible =
        element.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';

      // 4. valid 판정
      let valid = 'pass';
      if (hasBlurEvent || hasOutlineZero) {
        valid = 'fail';
      }

      return {
        element: element,
        tag: element.tagName.toLowerCase(),
        text: element.textContent?.trim() || '',
        issueType,
        issueValue,
        valid,
        hasBlurEvent,
        hasOutlineZero,
        hidden: !visible,
      };
    })
    .filter((item) => item !== null && item.valid === 'fail'); // 문제가 있는 요소만 반환
}

/**
 * 6.4.1 반복 영역 건너뛰기 검사
 */
export function checkSkipNav() {
  return Array.from([...document.querySelectorAll('a')].slice(0, 20))
    .map((a, index) => {
      if (!a.getAttribute('href')?.startsWith('#')) return null;
      const href = a.getAttribute('href');
      const isConnectedLink =
        href === '#'
          ? false
          : !!document.getElementById(href.replace('#', '')) ||
            document.getElementsByName(href.replace('#', '')).length > 0;
      const valid = isConnectedLink ? 'pass' : 'fail';
      const visible =
        a.offsetParent !== null &&
        a.style.visibility !== 'hidden' &&
        a.style.display !== 'none';
      return {
        hidden: !visible,
        element: a,
        label: index + 1 + '번째 링크',
        value: '(' + href + ') ' + a.innerText,
        connected: isConnectedLink,
        valid,
      };
    })
    .filter((item) => item !== null);
}

/**
 * 6.4.2 제목 제공 - 페이지 검사
 */
export function checkPageTitle() {
  const title = document.title || '';
  const dupCharacters = [
    '::',
    '||',
    '--',
    '@@',
    '##',
    '$$',
    '%%',
    '&&',
    '**',
    '((',
    '))',
    '++',
    '==',
    '~~',
    ';;',
    '<<',
    '>>',
    '[[',
    ']]',
    '★★',
    '☆☆',
    '◎◎',
    '●●',
    '◆◆',
    '◇◇',
    '□□',
    '■■',
    '△△',
    '▲▲',
    '▽▽',
    '▼▼',
    '◁◁',
    '◀◀',
    '▷▷',
    '▶▶',
    '♠♠',
    '♤♤',
    '♡♡',
    '♥♥',
    '♧♧',
    '♣♣',
    '⊙⊙',
    '◈◈',
    '▣▣',
    '◐◐',
    '◑◑',
    '▒▒',
    '▤▤',
    '▥▥',
    '▨▨',
    '▧▧',
    '▦▦',
    '▩▩',
    '♨♨',
    '☏☏',
    '☎☎',
  ];
  const hasTitle = !!title;
  let hasSpecialCharactersDup = false;
  for (let i = 0; i < dupCharacters.length; i++) {
    if (title.indexOf(dupCharacters[i]) > -1) {
      hasSpecialCharactersDup = true;
      break;
    }
  }

  return {
    element: document,
    title,
    valid: hasTitle && !hasSpecialCharactersDup ? 'pass' : 'fail',
  };
}

/**
 * 6.4.2 제목 제공 - 프레임 검사
 */
export function checkFrames() {
  function getAllFrames(doc: Document): HTMLIFrameElement[] {
    const frames = Array.from(doc.querySelectorAll('iframe'));
    const nestedFrames = frames.flatMap((frame) => {
      try {
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;
        return frameDoc ? getAllFrames(frameDoc) : [];
      } catch {
        // cross-origin iframe은 접근할 수 없으므로 무시
        return [];
      }
    });
    return [...frames, ...nestedFrames];
  }

  return getAllFrames(document).map((frame) => {
    const style = window.getComputedStyle(frame);
    const visible =
      frame.offsetParent !== null &&
      style.visibility !== 'hidden' &&
      style.display !== 'none';
    return {
      element: frame,
      label: 'iframe',
      value: frame.getAttribute('title') || '',
      contents: frame.getAttribute('src') || '',
      valid: frame.getAttribute('title') ? 'pass' : 'fail',
      hidden: !visible,
    };
  });
}

/**
 * 6.4.2 제목 제공 - 콘텐츠 블록 검사
 */
export function checkHeadings() {
  return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(
    (heading) => {
      const style = window.getComputedStyle(heading);
      const visible =
        heading.offsetParent !== null &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';
      return {
        element: heading,
        label: 'heading',
        value: heading.tagName.toLowerCase(),
        contents: heading.textContent?.trim() || '',
        valid: 'pass',
        hidden: !visible,
      };
    },
  );
}

/**
 * 7.1.1 기본 언어 표시 검사
 */
export function checkPageLang() {
  function getAllFrameDocuments(doc: Document): Document[] {
    const frames = Array.from(doc.querySelectorAll('iframe'));
    const nestedFrameDocuments = frames.flatMap((frame) => {
      try {
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;
        return frameDoc ? getAllFrameDocuments(frameDoc) : [];
      } catch {
        // cross-origin iframe은 접근할 수 없으므로 무시
        return [];
      }
    });
    return [doc, ...nestedFrameDocuments];
  }

  return getAllFrameDocuments(document)
    .map((doc) => {
      try {
        const html = doc.documentElement;
        const isXhtml =
          html?.getAttribute('xmlns') === 'http://www.w3.org/1999/xhtml';
        const lang = html?.getAttribute('lang') || '';
        const xmlLang = html?.getAttribute('xml:lang') || '';
        const url = doc.location.href || '';

        // http 이외의 페이지는 검사하지 않음
        if (url.indexOf('http://') === -1  && url.indexOf('https://') === -1) {
          return null;
        }

        let valid = 'fail';
        let value = '';
        if (isXhtml && xmlLang && lang) {
          valid = 'pass';
          value = 'xml:lang=' + xmlLang + ', lang=' + lang;
        } else if (isXhtml && xmlLang) {
          valid = 'warning';
          value = 'xml:lang=' + xmlLang;
        } else if (lang) {
          valid = 'pass';
          value = 'lang=' + lang;
        }

        return {
          element: doc,
          lang: lang || '',
          url,
          valid,
          value,
        };
      } catch {
        return null;
      }
    })
    .filter((item) => item !== null);
}

/**
 * 7.2.1 사용자 요청에 의한 새창/팝업 접근성 검사
 * - a, area, input, button에 대해 click 이벤트에 window.open 실행 여부 확인
 * - window.open이 있으면 title 없으면 fail
 * - a, area는 target=_blank면 pass
 * - textContent에 새창, 팝업, new win이 있으면 pass
 */
export function checkUserRequest() {
  const elements = Array.from(
    document.querySelectorAll('a, area, input, button'),
  );
  const results = [];
  elements.forEach((el) => {
    let hasWindowOpen = false;
    // 1. click 이벤트에 window.open이 있는지 확인
    // inline onclick
    const onclick = el.getAttribute('onclick');
    if (onclick && /window\.open\s*\(/.test(onclick)) {
      hasWindowOpen = true;
    }
    // addEventListener 등으로 등록된 이벤트는 jsdom에서 확인이 어려움(실제 환경에서는 커스텀 분석 필요)
    // 여기서는 inline만 체크
    if (hasWindowOpen) {
      // 2. title 없으면 fail
      let valid = 'fail';
      const title = el.getAttribute('title') || '';
      // 3. a, area는 target=_blank면 pass
      if (
        (el.tagName.toLowerCase() === 'a' ||
          el.tagName.toLowerCase() === 'area') &&
        el.getAttribute('target') === '_blank'
      ) {
        valid = 'pass';
      }
      // 4. textContent에 새창, 팝업, new win이 있으면 pass
      const text = (el.textContent || '').toLowerCase();
      if (
        text.includes('새창') ||
        text.includes('팝업') ||
        text.includes('new win')
      ) {
        valid = 'pass';
      }
      if (title) {
        valid = 'pass';
      }
      const visible =
        el.offsetParent !== null &&
        el.style.visibility !== 'hidden' &&
        el.style.display !== 'none';
      results.push({
        element: el,
        tag: el.tagName.toLowerCase(),
        title,
        target: el.getAttribute('target') || '',
        text: el.textContent || '',
        valid,
        hidden: !visible,
      });
    }
  });
  return results;
}

/**
 * 7.3.2 레이블 제공 검사
 */
export function checkInputLabels() {
  const inputs = Array.from(
    document.querySelectorAll(
      'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="hidden"]):not([type="image"]), select, textarea',
    ),
  );

  function isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.getBoundingClientRect().height > 0
    );
  }

  return inputs.map((input) => {
    const isHidden = !isVisible(input);
    const type = input.getAttribute('type') || 'text';
    const title = input.getAttribute('title') || '';
    let label = '';

    // label 연결 확인
    let hasLabel = false;
    let hasTitle = false;

    // 1. 연결된 label 확인
    if (input.id) {
      const labelElement = document.querySelector(`label[for="${input.id}"]`);
      if (labelElement) {
        hasLabel = true;
        label = labelElement.textContent || '';
      }
    }

    // 2. 부모 label 확인
    if (!hasLabel) {
      const parentLabel = input.closest('label');
      if (parentLabel) {
        hasLabel = true;
        label = parentLabel.textContent || '';
      }
    }

    // 3. title 속성 확인
    if (title) {
      hasTitle = true;
    }

    return {
      element: input,
      hidden: isHidden,
      tagName: input.tagName.toLowerCase(),
      type,
      label,
      valid: hasLabel ? 'pass' : hasTitle ? 'warning' : 'fail',
      title: title,
      hasLabel,
      hasTitle,
    };
  });
}

/**
 * 8.2.1 웹 애플리케이션 접근성 준수
 */
export interface WebApplicationResult {
  interface: string;
  index: number;
  valid: 'pass' | 'fail' | 'warning';
  issues: string[];
  [key: string]: any; // 추가 속성들을 위한 인덱스 시그니처
}

export function checkWebApplication(): WebApplicationResult[] {
  const results = [];

  // 1. 탭 인터페이스 검사
  const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
  tablists.forEach((tablist, index) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    
    // tab의 aria-controls 속성을 통해 연결된 tabpanel들만 찾기
    const connectedTabpanels: Element[] = [];
    tabs.forEach(tab => {
      const controls = tab.getAttribute('aria-controls');
      if (controls) {
        // aria-controls는 공백으로 구분된 여러 ID를 가질 수 있음
        const panelIds = controls.split(/\s+/);
        panelIds.forEach(panelId => {
          const panel = document.getElementById(panelId);
          if (panel && panel.getAttribute('role') === 'tabpanel') {
            connectedTabpanels.push(panel);
          }
        });
      }
    });

    let valid = 'pass';
    const issues = [];

    // tablist 내부에 tab이 없으면 fail
    if (tabs.length === 0) {
      valid = 'fail';
      issues.push('tablist 내부에 tab role이 없음');
    }
    // tab이 있지만 연결된 tabpanel이 없으면 fail
    else if (tabs.length > 0 && connectedTabpanels.length === 0) {
      valid = 'fail';
      issues.push('tab role이 있지만 연결된 tabpanel이 없음');
    }
    // tab과 연결된 tabpanel의 수가 맞지 않으면 warning
    else if (tabs.length !== connectedTabpanels.length) {
      valid = 'warning';
      issues.push(
        `tab(${tabs.length})과 연결된 tabpanel(${connectedTabpanels.length})의 수가 일치하지 않음`,
      );
    }

    const visible =
      tablist.offsetParent !== null &&
      tablist.style.visibility !== 'hidden' &&
      tablist.style.display !== 'none';

    results.push({
      element: tablist,
      interface: 'tablist',
      index: index + 1,
      tabs: tabs.length,
      tabpanels: connectedTabpanels.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 2. 메뉴 인터페이스 검사
  const menubars = Array.from(document.querySelectorAll('[role="menubar"]'));
  const menus = Array.from(document.querySelectorAll('[role="menu"]'));

  [...menubars, ...menus].forEach((menu, index) => {
    const menuitems = Array.from(menu.querySelectorAll('[role="menuitem"]'));
    const menuitemcheckboxes = Array.from(
      menu.querySelectorAll('[role="menuitemcheckbox"]'),
    );
    const menuitemradios = Array.from(
      menu.querySelectorAll('[role="menuitemradio"]'),
    );

    let valid = 'pass';
    const issues = [];

    // menu/menubar 내부에 menuitem이 없으면 fail
    if (
      menuitems.length === 0 &&
      menuitemcheckboxes.length === 0 &&
      menuitemradios.length === 0
    ) {
      valid = 'fail';
      issues.push('menu/menubar 내부에 menuitem이 없음');
    }

    const visible =
      menu.offsetParent !== null &&
      menu.style.visibility !== 'hidden' &&
      menu.style.display !== 'none';

    results.push({
      element: menu,
      interface: menu.getAttribute('role'),
      index: index + 1,
      menuitems: menuitems.length,
      menuitemcheckboxes: menuitemcheckboxes.length,
      menuitemradios: menuitemradios.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 3. 콤보 박스 인터페이스 검사
  const comboboxes = Array.from(document.querySelectorAll('[role="combobox"]'));
  comboboxes.forEach((combobox, index) => {
    // 1. 먼저 내부에서 listbox 찾기
    let listbox = combobox.querySelector('[role="listbox"]');
    
    // 2. 없으면 aria-controls로 외부에서 찾기
    if (!listbox) {
      const controls = combobox.getAttribute('aria-controls');
      if (controls) {
        listbox = document.getElementById(controls);
        // listbox 역할인지 확인
        if (listbox && listbox.getAttribute('role') !== 'listbox') {
          listbox = null;
        }
      }
    }
    
    const options = listbox ? Array.from(listbox.querySelectorAll('[role="option"]')) : [];

    let valid = 'pass';
    const issues = [];

    // combobox와 연결된 listbox가 없으면 fail
    if (!listbox) {
      valid = 'fail';
      issues.push('combobox와 연결된 listbox가 없음');
    }

    // listbox가 있지만 option이 없으면 fail
    if (listbox && options.length === 0) {
      valid = 'fail';
      issues.push('listbox가 있지만 option이 없음');
    }

    const visible =
      combobox.offsetParent !== null &&
      combobox.style.visibility !== 'hidden' &&
      combobox.style.display !== 'none';

    results.push({
      element: combobox,
      interface: 'combobox',
      index: index + 1,
      hasListbox: !!listbox,
      options: options.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 4. 그리드/표 인터페이스 검사
  const grids = Array.from(document.querySelectorAll('[role="grid"]'));
  const tables = Array.from(document.querySelectorAll('[role="table"]'));

  [...grids, ...tables].forEach((grid, index) => {
    const rows = Array.from(grid.querySelectorAll('[role="row"]'));
    const rowheaders = Array.from(grid.querySelectorAll('[role="rowheader"]'));
    const columnheaders = Array.from(
      grid.querySelectorAll('[role="columnheader"]'),
    );
    const cells = Array.from(grid.querySelectorAll('[role="cell"]'));

    let valid = 'pass';
    const issues = [];

    // grid/table 내부에 row가 없으면 fail
    if (rows.length === 0) {
      valid = 'fail';
      issues.push('grid/table 내부에 row가 없음');
    }

    // 모든 row에 cell이나 header가 하나도 없으면 fail
    if (rows.length > 0 && cells.length === 0 && rowheaders.length === 0 && columnheaders.length === 0) {
      valid = 'fail';
      issues.push('모든 row에 cell이나 header가 없음');
    }

    const visible =
      grid.offsetParent !== null &&
      grid.style.visibility !== 'hidden' &&
      grid.style.display !== 'none';

    results.push({
      element: grid,
      interface: grid.getAttribute('role'),
      index: index + 1,
      rows: rows.length,
      rowheaders: rowheaders.length,
      columnheaders: columnheaders.length,
      cells: cells.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 5. 트리 뷰 인터페이스 검사
  const trees = Array.from(document.querySelectorAll('[role="tree"]'));
  trees.forEach((tree, index) => {
    const treeitems = Array.from(tree.querySelectorAll('[role="treeitem"]'));
    const groups = Array.from(tree.querySelectorAll('[role="group"]'));

    let valid = 'pass';
    const issues = [];

    // tree 내부에 treeitem이 없으면 fail
    if (treeitems.length === 0) {
      valid = 'fail';
      issues.push('tree 내부에 treeitem이 없음');
    }

    const visible =
      tree.offsetParent !== null &&
      tree.style.visibility !== 'hidden' &&
      tree.style.display !== 'none';

    results.push({
      element: tree,
      interface: 'tree',
      index: index + 1,
      treeitems: treeitems.length,
      groups: groups.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 6. 다이얼로그 인터페이스 검사
  const dialogs = Array.from(
    document.querySelectorAll('[role="dialog"], [role="alertdialog"]'),
  );
  dialogs.forEach((dialog, index) => {
    const hasTitle =
      dialog.getAttribute('aria-labelledby') ||
      dialog.getAttribute('aria-label') ||
      dialog.querySelector('[role="heading"]');

    let valid = 'pass';
    const issues = [];

    // dialog에 제목이 없으면 fail
    if (!hasTitle) {
      valid = 'fail';
      issues.push('dialog에 제목(aria-labelledby, aria-label, heading)이 없음');
    }

    const visible =
      dialog.offsetParent !== null &&
      dialog.style.visibility !== 'hidden' &&
      dialog.style.display !== 'none';

    results.push({
      element: dialog,
      interface: dialog.getAttribute('role'),
      index: index + 1,
      hasTitle: !!hasTitle,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 7. 툴바 인터페이스 검사
  const toolbars = Array.from(document.querySelectorAll('[role="toolbar"]'));
  toolbars.forEach((toolbar, index) => {
    const buttons = Array.from(
      toolbar.querySelectorAll('button, [role="button"]'),
    );
    const links = Array.from(toolbar.querySelectorAll('a'));
    const inputs = Array.from(toolbar.querySelectorAll('input'));

    let valid = 'pass';
    const issues = [];

    // toolbar 내부에 상호작용 요소가 없으면 fail
    if (buttons.length === 0 && links.length === 0 && inputs.length === 0) {
      valid = 'fail';
      issues.push('toolbar 내부에 상호작용 요소(button, link, input)가 없음');
    }

    const visible =
      toolbar.offsetParent !== null &&
      toolbar.style.visibility !== 'hidden' &&
      toolbar.style.display !== 'none';

    results.push({
      element: toolbar,
      interface: 'toolbar',
      index: index + 1,
      buttons: buttons.length,
      links: links.length,
      inputs: inputs.length,
      hidden: !visible,
      valid,
      issues,
    });
  });

  // 8. 리스트 박스 인터페이스 검사
  const listboxes = Array.from(document.querySelectorAll('[role="listbox"]'));
  listboxes.forEach((listbox, index) => {
    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    const groups = Array.from(listbox.querySelectorAll('[role="group"]'));

    let valid = 'pass';
    const issues = [];

    // listbox 내부에 option이 없으면 fail
    if (options.length === 0) {
      valid = 'fail';
      issues.push('listbox 내부에 option이 없음');
    }

    const visible =
      listbox.offsetParent !== null &&
      listbox.style.visibility !== 'hidden' &&
      listbox.style.display !== 'none';

    results.push({
      element: listbox,
      interface: 'listbox',
      index: index + 1,
      options: options.length,
      groups: groups.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  // 9. 라디오 그룹 인터페이스 검사
  const radiogroups = Array.from(document.querySelectorAll('[role="radiogroup"]'));
  radiogroups.forEach((radiogroup, index) => {
    const radios = Array.from(radiogroup.querySelectorAll('[role="radio"]'));

    let valid = 'pass';
    const issues = [];

    // radiogroup 내부에 radio가 없으면 fail
    if (radios.length === 0) {
      valid = 'fail';
      issues.push('radiogroup 내부에 radio가 없음');
    }

    const visible =
      radiogroup.offsetParent !== null &&
      radiogroup.style.visibility !== 'hidden' &&
      radiogroup.style.display !== 'none';

    results.push({
      element: radiogroup,
      interface: 'radiogroup',
      index: index + 1,
      radios: radios.length,
      valid,
      issues,
      hidden: !visible,
    });
  });

  return results;
}
