/**
 * @jest-environment jsdom
 */
import {
  checkImages,
  checkBgImages,
  checkSkipNav,
  checkPageTitle,
  checkFrames,
  checkHeadings,
  checkInputLabels,
  checkPageLang,
  checkTables,
  checkUserRequest,
  checkFocus,
  checkWebApplication,
} from './rule';

describe('5.1.1 적절한 대체 텍스트 제공 (img) 검사: checkImages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkImages: alt 속성이 있는 img는 pass, alt가 없으면 fail, 빈 alt는 warning을 반환해야 한다', () => {
    document.body.innerHTML = `
      <img src="a.jpg" alt="설명" />
      <img src="b.jpg" />
      <img src="c.jpg" alt="" />
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('warning');
  });

  it('checkImages: input[type="image"]의 alt 속성 유무에 따라 valid가 올바르게 반환된다', () => {
    document.body.innerHTML = `
      <input type="image" src="btn.png" alt="버튼이미지" />
      <input type="image" src="btn2.png" />
      <input type="image" src="btn3.png" alt="" />
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('warning');
  });

  it('checkImages: area 태그의 alt 속성 유무에 따라 valid가 올바르게 반환된다', () => {
    document.body.innerHTML = `
      <map name="mymap">
        <area shape="rect" coords="0,0,82,126" href="#" alt="네이버" />
        <area shape="rect" coords="90,58,3,3" href="#" />
        <area shape="rect" coords="34,45,12,12" href="#" alt="" />
      </map>
    `;
    const results = checkImages();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
    expect(results[2].valid).toBe('fail'); // 이미지맵 area는 빈 alt도 fail
  });

  it('checkImages: 숨겨진 이미지는 hidden: true로 반환된다', () => {
    document.body.innerHTML = `
      <img id="img1" src="a.jpg" alt="숨김" style="display:none" />
      <img id="img2" src="b.jpg" alt="숨김2" style="visibility:hidden" />
      <img id="img3" src="c.jpg" alt="보임" />
    `;
    // jsdom에서는 offsetParent가 항상 null이므로, 직접 지정해준다
    Object.defineProperty(document.getElementById('img1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('img2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('img3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });

    const results = checkImages();
    expect(results[0].hidden).toBe(true);
    expect(results[1].hidden).toBe(true);
    expect(results[2].hidden).toBe(false);
  });

  it('checkImages: longdesc 속성이 있으면 결과에 포함된다', () => {
    document.body.innerHTML = `
      <img src="a.jpg" alt="desc" longdesc="desc.html" />
      <img src="b.jpg" alt="no-desc" />
    `;
    const results = checkImages();
    expect(results[0].longdesc).toBe('desc.html');
    expect(results[1].longdesc).toBeNull();
  });

  it('checkImages: src가 상대경로/절대경로/없는 경우 모두 절대경로로 반환된다', () => {
    document.body.innerHTML = `
      <img src="/a.jpg" alt="절대" />
      <img src="b.jpg" alt="상대" />
      <img alt="없음" />
    `;
    const results = checkImages();
    expect(results[0].src.startsWith('http')).toBe(true);
    expect(results[1].src.startsWith('http')).toBe(true);
    expect(results[2].src).toBe('http://localhost/'); // jsdom에서는 src가 빈 값이 아니라 http://localhost/ 로 반환된다
  });

  it('checkImages: 상호작용 이미지 검증 - 링크 안의 이미지', () => {
    document.body.innerHTML = `
      <a href="/page1"><img src="link1.jpg" alt="페이지 링크" /></a>
      <a href="/page2"><img src="link2.jpg" alt="" /></a>
      <a href="/page3"><img src="link3.jpg" /></a>
      <a href="/page4"><img src="link4.jpg" alt="image" /></a>
    `;
    const results = checkImages();
    expect(results[0].isInteractive).toBe(true);
    expect(results[0].valid).toBe('pass');
    expect(results[1].isInteractive).toBe(true);
    expect(results[1].valid).toBe('fail');
    expect(results[1].issues).toContain('상호작용 이미지의 alt가 비어있음');
    expect(results[2].isInteractive).toBe(true);
    expect(results[2].valid).toBe('fail');
    expect(results[2].issues).toContain('alt 속성이 없음');
    expect(results[3].isInteractive).toBe(true);
    expect(results[3].valid).toBe('fail');
    expect(results[3].issues).toContain('상호작용 이미지의 alt가 무의미함');
  });

  it('checkImages: 상호작용 이미지 검증 - 버튼 안의 이미지', () => {
    document.body.innerHTML = `
      <button><img src="btn1.jpg" alt="확인" /></button>
      <div role="button"><img src="btn2.jpg" alt="" /></div>
      <img src="btn3.jpg" alt="클릭" onclick="handleClick()" />
    `;
    const results = checkImages();
    expect(results[0].isInteractive).toBe(true);
    expect(results[0].valid).toBe('pass');
    expect(results[1].isInteractive).toBe(true);
    expect(results[1].valid).toBe('fail');
    expect(results[2].isInteractive).toBe(true);
    expect(results[2].valid).toBe('pass');
  });

  it('checkImages: 장식적 이미지 검증', () => {
    document.body.innerHTML = `
      <img src="deco1.jpg" alt="" />
      <img src="deco2.jpg" role="presentation" alt="장식" />
      <img src="deco3.jpg" role="none" alt="" />
      <img src="deco4.jpg" role="presentation" alt="" />
    `;
    const results = checkImages();
    // 첫 번째는 단순 빈 alt이므로 명시적 장식 아님
    expect(results[0].isDecorative).toBe(false);
    expect(results[0].valid).toBe('warning');
    // role="presentation"이면 장식적
    expect(results[1].isDecorative).toBe(true);
    expect(results[1].valid).toBe('warning');
    expect(results[1].issues).toContain('장식적 이미지에 불필요한 alt 텍스트');
    // role="none"이면 장식적
    expect(results[2].isDecorative).toBe(true);
    expect(results[2].valid).toBe('pass');
    // role="presentation" + 빈 alt면 올바른 장식적
    expect(results[3].isDecorative).toBe(true);
    expect(results[3].valid).toBe('pass');
  });

  it('checkImages: 무의미한 alt 텍스트 검증', () => {
    document.body.innerHTML = `
      <img src="img1.jpg" alt="image" />
      <img src="img2.jpg" alt="그림" />
      <img src="img3.jpg" alt="icon" />
      <img src="img4.jpg" alt="banner" />
      <img src="img5.jpg" alt="logo" />
      <img src="img6.jpg" alt="123.jpg" />
      <img src="img7.jpg" alt="image_001.png" />
      <img src="img8.jpg" alt="의미있는 설명" />
    `;
    const results = checkImages();
    expect(results[0].hasMeaninglessAlt).toBe(true);
    expect(results[0].valid).toBe('warning');
    expect(results[1].hasMeaninglessAlt).toBe(true);
    expect(results[1].valid).toBe('warning');
    expect(results[2].hasMeaninglessAlt).toBe(true);
    expect(results[2].valid).toBe('warning');
    expect(results[3].hasMeaninglessAlt).toBe(true);
    expect(results[3].valid).toBe('warning');
    expect(results[4].hasMeaninglessAlt).toBe(true);
    expect(results[4].valid).toBe('warning');
    expect(results[5].hasMeaninglessAlt).toBe(true);
    expect(results[5].valid).toBe('warning');
    expect(results[6].hasMeaninglessAlt).toBe(true);
    expect(results[6].valid).toBe('warning');
    expect(results[7].hasMeaninglessAlt).toBe(false);
    expect(results[7].valid).toBe('pass');
  });

  it('checkImages: 콘텐츠 이미지 검증', () => {
    document.body.innerHTML = `
      <img src="content1.jpg" alt="" />
      <img src="content2.jpg" alt="의미있는 설명" />
      <img src="content3.jpg" alt="photo" />
    `;
    const results = checkImages();
    expect(results[0].isInteractive).toBe(false);
    expect(results[0].isDecorative).toBe(false); // 명시적 role 없으면 장식적 아님
    expect(results[0].valid).toBe('warning'); // 빈 alt는 warning
    expect(results[1].isInteractive).toBe(false);
    expect(results[1].isDecorative).toBe(false);
    expect(results[1].valid).toBe('pass');
    expect(results[2].isInteractive).toBe(false);
    expect(results[2].isDecorative).toBe(false);
    expect(results[2].hasMeaninglessAlt).toBe(true);
    expect(results[2].valid).toBe('warning');
    expect(results[2].issues).toContain('무의미한 alt 텍스트 - 이미지의 목적과 내용을 설명하는 텍스트 필요');
  });

  it('checkImages: 복합 시나리오 검증', () => {
    document.body.innerHTML = `
      <a href="/home"><img src="nav1.jpg" alt="" /></a>
      <a href="/about"><img src="nav2.jpg" alt="회사소개" /></a>
      <div><img src="content1.jpg" alt="" /></div>
      <div><img src="content2.jpg" alt="차트 데이터" /></div>
      <button><img src="btn1.jpg" alt="icon" /></button>
    `;
    const results = checkImages();
    // 링크 안의 빈 alt 이미지
    expect(results[0].isInteractive).toBe(true);
    expect(results[0].valid).toBe('fail');
    // 링크 안의 적절한 alt 이미지
    expect(results[1].isInteractive).toBe(true);
    expect(results[1].valid).toBe('pass');
    // 일반 div 안의 빈 alt 이미지 (warning)
    expect(results[2].isDecorative).toBe(false);
    expect(results[2].valid).toBe('warning');
    // 일반 div 안의 의미있는 alt 이미지
    expect(results[3].isDecorative).toBe(false);
    expect(results[3].valid).toBe('pass');
    // 버튼 안의 무의미한 alt 이미지
    expect(results[4].isInteractive).toBe(true);
    expect(results[4].hasMeaninglessAlt).toBe(true);
    expect(results[4].valid).toBe('fail');
  });

  // 새로운 고도화 기능 테스트
  describe('checkImages 고도화: SVG, longdesc, 이미지맵 지원', () => {
    it('SVG 요소의 접근성을 올바르게 검증한다', () => {
      document.body.innerHTML = `
        <svg><title>차트 제목</title><desc>상세 설명</desc></svg>
        <svg aria-label="아이콘"></svg>
        <svg role="presentation"></svg>
        <svg></svg>
      `;
      const results = checkImages();
      
      // title과 desc가 모두 있는 SVG
      expect(results[0].tagName).toBe('svg');
      expect(results[0].svgTitle).toBe('차트 제목');
      expect(results[0].svgDesc).toBe('상세 설명');
      expect(results[0].valid).toBe('pass');
      
      // aria-label이 있는 SVG
      expect(results[1].tagName).toBe('svg');
      expect(results[1].valid).toBe('pass');
      
      // 장식적 SVG (role="presentation")
      expect(results[2].tagName).toBe('svg');
      expect(results[2].valid).toBe('pass');
      
      // 접근 가능한 이름이 없는 SVG
      expect(results[3].tagName).toBe('svg');
      expect(results[3].valid).toBe('fail');
      expect(results[3].issues).toContain('SVG에 접근 가능한 이름이 없음 - <title>, alt, aria-label 중 하나 필요');
    });

    it('longdesc 속성을 올바르게 검증한다', () => {
      document.body.innerHTML = `
        <img src="chart.jpg" alt="매출 차트" longdesc="chart-description.html" />
        <img src="normal.jpg" alt="일반 이미지" />
      `;
      const results = checkImages();
      
      // 유효한 longdesc가 있는 이미지
      expect(results[0].longdesc).toBe('chart-description.html');
      expect(results[0].valid).toBe('pass');
      expect(results[0].issues).toContain('복잡한 이미지에 대한 상세 설명 제공됨 (longdesc)');
      
      // longdesc가 없는 일반 이미지
      expect(results[1].longdesc).toBe(null);
      expect(results[1].valid).toBe('pass');
    });

    it('이미지맵 area 요소를 올바르게 검증한다', () => {
      document.body.innerHTML = `
        <map name="navigation">
          <area href="/home" alt="홈으로 가기" />
          <area href="/about" alt="" />
          <area href="/contact" alt="image" />
          <area href="/products" />
        </map>
        <img src="nav.jpg" usemap="#navigation" alt="네비게이션" />
      `;
      const results = checkImages();
      
      // area 요소들 찾기 (img는 마지막)
      const areaResults = results.filter(r => r.tagName === 'area');
      
      // 적절한 alt가 있는 area
      expect(areaResults[0].isImageMapArea).toBe(true);
      expect(areaResults[0].alt).toBe('홈으로 가기');
      expect(areaResults[0].valid).toBe('pass');
      
      // 빈 alt가 있는 area
      expect(areaResults[1].isImageMapArea).toBe(true);
      expect(areaResults[1].alt).toBe(''); // 빈 문자열
      expect(areaResults[1].valid).toBe('fail');
      expect(areaResults[1].issues).toContain('이미지맵 영역의 alt가 비어있음 - 해당 영역의 목적지나 기능을 설명해야 함');
      
      // 무의미한 alt가 있는 area
      expect(areaResults[2].isImageMapArea).toBe(true);
      expect(areaResults[2].alt).toBe('image');
      expect(areaResults[2].hasMeaninglessAlt).toBe(true);
      expect(areaResults[2].valid).toBe('warning');
      
      // alt 속성이 없는 area
      expect(areaResults[3].isImageMapArea).toBe(true);
      expect(areaResults[3].alt).toBe(null);
      expect(areaResults[3].valid).toBe('fail');
      expect(areaResults[3].issues).toContain('이미지맵 영역에 alt 속성이 없음');
    });

    it('복합 시나리오: SVG + 이미지맵 + longdesc 함께 테스트', () => {
      document.body.innerHTML = `
        <svg role="img" aria-label="복잡한 차트"><title>매출 데이터</title><desc>2024년 1-4분기 매출 증감 현황</desc></svg>
        <img src="complex-chart.jpg" alt="연도별 매출 비교" longdesc="sales-details.html" />
        <map name="siteMap">
          <area href="/dashboard" alt="대시보드" />
          <area href="/reports" alt="리포트 페이지로 이동" />
        </map>
        <img src="sitemap.jpg" usemap="#siteMap" alt="사이트 맵" />
      `;
      const results = checkImages();
      
      // 복잡한 SVG (최고 수준의 접근성)
      expect(results[0].tagName).toBe('svg');
      expect(results[0].svgTitle).toBe('매출 데이터');
      expect(results[0].svgDesc).toBe('2024년 1-4분기 매출 증감 현황');
      expect(results[0].valid).toBe('pass');
      
      // longdesc가 있는 복잡한 이미지
      expect(results[1].tagName).toBe('img');
      expect(results[1].longdesc).toBe('sales-details.html');
      expect(results[1].valid).toBe('pass');
      expect(results[1].issues).toContain('복잡한 이미지에 대한 상세 설명 제공됨 (longdesc)');
      
      // 이미지맵 area들
      const areas = results.filter(r => r.isImageMapArea);
      expect(areas).toHaveLength(2);
      expect(areas[0].valid).toBe('pass');
      expect(areas[1].valid).toBe('pass');
    });
  });
});

describe('5.1.1 적절한 대체 텍스트 제공 (bg) 검사: checkBgImages', () => {
  it('checkBgImages: backgroundImage가 있는 요소만 반환한다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg')"></div>
      <div id="bg2" style="background-image: none"></div>
      <span id="bg3" style="background-image: url('b.png')"></span>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    // getComputedStyle mock
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg2')
        return {
          backgroundImage: 'none',
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg3')
        return {
          backgroundImage: "url('b.png')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results.length).toBe(2);
    expect(results[0].src.endsWith('a.jpg')).toBe(true);
    expect(results[1].src.endsWith('b.png')).toBe(true);
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: aria-label, title 속성이 alt로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg')" aria-label="라벨"></div>
      <div id="bg2" style="background-image: url('b.jpg')" title="타이틀"></div>
      <div id="bg3" style="background-image: url('c.jpg')"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results[0].alt).toBe('라벨');
    expect(results[0].valid).toBe('pass');
    expect(results[1].alt).toBe('타이틀');
    expect(results[1].valid).toBe('pass');
    expect(results[2].alt).toBe('');
    expect(results[2].valid).toBe('warning');
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: 상호작용 요소의 배경 이미지는 더 엄격하게 검증', () => {
    document.body.innerHTML = `
      <button id="bg1" style="background-image: url('btn.jpg')">버튼</button>
      <a id="bg2" href="#" style="background-image: url('link.jpg')">링크</a>
      <div id="bg3" role="button" style="background-image: url('div-btn.jpg')">DIV 버튼</div>
      <div id="bg4" tabindex="0" style="background-image: url('focusable.jpg')">포커스 가능</div>
    `;
    ['bg1', 'bg2', 'bg3', 'bg4'].forEach(id => {
      Object.defineProperty(document.getElementById(id), 'offsetParent', {
        value: document.body,
        configurable: true,
      });
    });
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = (el as Element).id;
      if (['bg1', 'bg2', 'bg3', 'bg4'].includes(id)) {
        return {
          backgroundImage: 'url("test.jpg")',
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      }
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results).toHaveLength(4);
    results.forEach(result => {
      expect(result.valid).toBe('fail');
      expect(result.isInteractive).toBe(true);
      expect(result.issues).toContain('상호작용 요소의 배경 이미지에 대체 텍스트가 없음');
    });
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: 상호작용 요소에 대체 텍스트가 있으면 pass', () => {
    document.body.innerHTML = `
      <button id="bg1" style="background-image: url('btn.jpg')" aria-label="메뉴">버튼</button>
      <a id="bg2" href="#" style="background-image: url('link.jpg')" title="홈으로">링크</a>
    `;
    ['bg1', 'bg2'].forEach(id => {
      Object.defineProperty(document.getElementById(id), 'offsetParent', {
        value: document.body,
        configurable: true,
      });
    });
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = (el as Element).id;
      if (['bg1', 'bg2'].includes(id)) {
        return {
          backgroundImage: 'url("test.jpg")',
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      }
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.valid).toBe('pass');
      expect(result.isInteractive).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: 숨겨진 요소는 hidden: true로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('a.jpg'); display:none"></div>
      <div id="bg2" style="background-image: url('b.jpg'); visibility:hidden"></div>
      <div id="bg3" style="background-image: url('c.jpg')"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'none',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'hidden',
        } as CSSStyleDeclaration;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results[0].hidden).toBe(true);
    expect(results[1].hidden).toBe(true);
    expect(results[2].hidden).toBe(false);
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });

  it('checkBgImages: src가 상대경로/절대경로/없는 경우 모두 절대경로로 반환된다', () => {
    document.body.innerHTML = `
      <div id="bg1" style="background-image: url('/a.jpg')"></div>
      <div id="bg2" style="background-image: url('b.jpg')"></div>
      <div id="bg3" style="background-image: url()"></div>
    `;
    Object.defineProperty(document.getElementById('bg1'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg2'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    Object.defineProperty(document.getElementById('bg3'), 'offsetParent', {
      value: document.body,
      configurable: true,
    });
    (jest.spyOn(window, 'getComputedStyle') as jest.MockedFunction<typeof window.getComputedStyle>).mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('/a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      if (id === 'bg3')
        return {
          backgroundImage: 'url()',
          display: 'block',
          visibility: 'visible',
        } as CSSStyleDeclaration;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as CSSStyleDeclaration;
    });
    const results = checkBgImages();
    expect(results[0].src.startsWith('http')).toBe(true);
    expect(results[1].src.startsWith('http')).toBe(true);
    expect(results[2].src).toBe('http://localhost/'); // jsdom에서는 src가 빈 값이 아니라 http://localhost/ 로 반환된다
    (window.getComputedStyle as jest.Mock).mockRestore?.();
  });
});

describe('5.3.1 표의 구성 검사: checkTables', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkTables: caption과 scope 있는 th가 있으면 pass', () => {
    document.body.innerHTML = `
      <table><caption>테이블</caption><thead><tr><th scope="col">헤더</th></tr></thead></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('pass');
  });
  it('checkTables: caption만 있고 scope 없는 th만 있으면 warning', () => {
    document.body.innerHTML = `
      <table><caption>테이블</caption><thead><tr><th>헤더</th></tr></thead></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: role이 presentation이면 warning', () => {
    document.body.innerHTML = `
      <table role="presentation"><caption>테이블</caption></table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: th가 없으면 fail 또는 warning (레이아웃 테이블 감지에 따라)', () => {
    document.body.innerHTML = `<table><caption>데이터 테이블</caption><thead><tr><td>데이터</td></tr></thead></table>`;
    const results = checkTables();
    // 라벨이 있는데 th가 없으면 여전히 fail이어야 함
    expect(results[0].valid).toBe('fail');
    expect(results[0].issues).toContain('제목 셀(th)이 없음');
  });
  it('checkTables: th는 있지만 라벨이 없으면 warning', () => {
    document.body.innerHTML = `<table><thead><tr><th>헤더</th></tr></thead></table>`;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
    expect(results[0].issues).toContain('표 라벨 추가 권장 (caption, aria-label, aria-labelledby)');
  });

  it('checkTables: aria-label이 있으면 라벨로 인식', () => {
    document.body.innerHTML = `
      <table aria-label="사용자 데이터">
        <thead><tr><th scope="col">이름</th><th scope="col">나이</th></tr></thead>
        <tbody><tr><td>김철수</td><td>25</td></tr></tbody>
      </table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('pass');
    expect(results[0].ariaLabel).toBe('사용자 데이터');
    expect(results[0].tableLabel).toBe('사용자 데이터');
    expect(results[0].hasAnyLabel).toBe(true);
  });

  it('checkTables: aria-labelledby가 최우선 라벨로 인식', () => {
    document.body.innerHTML = `
      <h2 id="table-title">월별 매출 현황</h2>
      <table aria-labelledby="table-title" aria-label="다른 라벨">
        <caption>표 캡션</caption>
        <thead><tr><th scope="col">월</th><th scope="col">매출</th></tr></thead>
      </table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('pass');
    expect(results[0].ariaLabelledBy).toBe('table-title');
    expect(results[0].tableLabel).toBe('월별 매출 현황');
    expect(results[0].hasAnyLabel).toBe(true);
  });

  it('checkTables: aria-labelledby가 존재하지 않는 ID를 참조하면 다음 우선순위로 fallback', () => {
    document.body.innerHTML = `
      <table aria-labelledby="nonexistent" aria-label="실제 라벨">
        <thead><tr><th scope="col">데이터</th></tr></thead>
      </table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('pass');
    expect(results[0].tableLabel).toBe('실제 라벨');
  });

  it('checkTables: 라벨 우선순위 테스트 (aria-labelledby > aria-label > caption > summary)', () => {
    document.body.innerHTML = `
      <table summary="요약" aria-label="ARIA 라벨">
        <caption>캡션</caption>
        <thead><tr><th>헤더</th></tr></thead>
      </table>
    `;
    const results = checkTables();
    expect(results[0].tableLabel).toBe('ARIA 라벨');
    expect(results[0].caption).toBe('캡션');
    expect(results[0].summary).toBe('요약');
  });

  it('checkTables: role="presentation"인 표에 라벨이 있으면 warning', () => {
    document.body.innerHTML = `
      <table role="presentation" aria-label="불필요한 라벨">
        <tr><td>레이아웃 테이블</td></tr>
      </table>
    `;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
    expect(results[0].issues).toContain('레이아웃 테이블에 불필요한 라벨이 있음');
  });

  // checkTables 확장 기능 테스트
  describe('checkTables 확장: headers-id, colspan/rowspan, 레이아웃 감지', () => {
    it('복잡한 테이블의 headers-id 연결을 올바르게 검증한다', () => {
      document.body.innerHTML = `
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
            <tr>
              <th id="design" headers="dept">디자인팀</th>
              <td headers="design manager">2</td>
              <td headers="design staff">8</td>
              <td headers="design total">10</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].valid).toBe('pass');
      expect(results[0].headersIdAnalysis.hasHeadersIdConnections).toBe(true);
      expect(results[0].headersIdAnalysis.cellsWithHeaders).toBe(8); // 8개 셀이 headers 속성 사용
      expect(results[0].headersIdAnalysis.cellsWithId).toBe(6); // 6개 셀이 id 속성 보유
      expect(results[0].headersIdAnalysis.headerConnectionIssues).toHaveLength(0);
    });

    it('잘못된 headers-id 연결을 감지한다', () => {
      document.body.innerHTML = `
        <table>
          <caption>잘못된 연결 테이블</caption>
          <thead>
            <tr>
              <th id="header1">헤더1</th>
              <th id="header2">헤더2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td headers="nonexistent">데이터1</td>
              <td headers="header1 wrongref">데이터2</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].headersIdAnalysis.headerConnectionIssues).toHaveLength(2);
      expect(results[0].headersIdAnalysis.headerConnectionIssues[0]).toContain('존재하지 않는 id "nonexistent"를 참조함');
      expect(results[0].headersIdAnalysis.headerConnectionIssues[1]).toContain('존재하지 않는 id "wrongref"를 참조함');
    });

    it('colspan/rowspan 사용 시 접근성 검증한다', () => {
      document.body.innerHTML = `
        <table>
          <caption>병합된 셀이 있는 테이블</caption>
          <thead>
            <tr>
              <th colspan="2" scope="colgroup" id="products">제품</th>
              <th rowspan="2" scope="rowgroup" id="sales">매출</th>
            </tr>
            <tr>
              <th scope="col" headers="products">이름</th>
              <th scope="col" headers="products">가격</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td headers="products">노트북</td>
              <td headers="products">100만원</td>
              <td headers="sales" rowspan="2">200만원</td>
            </tr>
            <tr>
              <td headers="products">마우스</td>
              <td headers="products">5만원</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].valid).toBe('pass');
      expect(results[0].spanAnalysis.hasSpannedCells).toBe(true);
      expect(results[0].spanAnalysis.spannedCells).toBe(3); // colspan=2, rowspan=2, rowspan=2
      expect(results[0].spanAnalysis.spanIssues).toHaveLength(0); // 모두 적절히 처리됨
    });

    it('colspan/rowspan이 부적절하게 사용된 경우 권장사항 제공', () => {
      document.body.innerHTML = `
        <table>
          <caption>복잡한 병합 구조</caption>
          <thead>
            <tr>
              <th colspan="2">제목 없는 병합 헤더</th>
              <th rowspan="3">다른 병합 헤더</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">병합된 데이터1</td>
            </tr>
            <tr>
              <td rowspan="2">병합된 데이터2</td>
              <td>일반 데이터</td>
            </tr>
            <tr>
              <td colspan="2">또 다른 병합</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].spanAnalysis.hasSpannedCells).toBe(true);
      expect(results[0].spanAnalysis.spannedCells).toBeGreaterThan(2);
      expect(results[0].spanAnalysis.spanIssues.length).toBeGreaterThan(0);
      expect(results[0].spanAnalysis.spanIssues.some((issue: string) => 
        issue.includes('scope 또는 id 권장') || issue.includes('headers 속성 권장')
      )).toBe(true);
    });

    it('레이아웃 테이블을 자동으로 감지한다', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td><img src="logo.jpg" alt="로고"></td>
            <td>
              <input type="text" placeholder="검색">
              <button>검색</button>
            </td>
          </tr>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].layoutAnalysis.isLikelyLayoutTable).toBe(true);
      expect(results[0].layoutAnalysis.indicators.noTh).toBe(true);
      expect(results[0].layoutAnalysis.indicators.hasFormControls).toBe(true);
      expect(results[0].valid).toBe('warning');
      expect(results[0].issues.some((issue: string) => 
        issue.includes('레이아웃 목적으로 보임') || issue.includes('CSS Grid/Flexbox 사용 권장')
      )).toBe(true);
    });

    it('데이터 테이블과 레이아웃 테이블을 구분한다', () => {
      document.body.innerHTML = `
        <div>
          <table id="data-table">
            <caption>실제 데이터 테이블</caption>
            <thead>
              <tr>
                <th scope="col">이름</th>
                <th scope="col">나이</th>
                <th scope="col">점수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>김철수</td>
                <td>25</td>
                <td>95</td>
              </tr>
              <tr>
                <td>이영희</td>
                <td>30</td>
                <td>88</td>
              </tr>
            </tbody>
          </table>
          
          <table id="layout-table">
            <tr>
              <td>메뉴1</td>
              <td>메뉴2</td>
              <td>메뉴3</td>
            </tr>
          </table>
        </div>
      `;
      const results = checkTables();
      
      // 데이터 테이블
      expect(results[0].layoutAnalysis.isLikelyLayoutTable).toBe(false);
      expect(results[0].valid).toBe('pass');
      
      // 레이아웃 테이블
      expect(results[1].layoutAnalysis.isLikelyLayoutTable).toBe(true);
      expect(results[1].valid).toBe('warning');
    });

    it('summary 속성에 대한 권장사항을 제공한다', () => {
      document.body.innerHTML = `
        <table summary="이 테이블은 deprecated summary를 사용함">
          <thead>
            <tr>
              <th scope="col">컬럼1</th>
              <th scope="col">컬럼2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>데이터1</td>
              <td>데이터2</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      expect(results[0].summary).toBe('이 테이블은 deprecated summary를 사용함');
      expect(results[0].issues.some((issue: string) => 
        issue.includes('summary는 deprecated') && issue.includes('caption이나 aria-label 사용 권장')
      )).toBe(true);
    });

    it('복합 시나리오: 모든 확장 기능이 함께 동작한다', () => {
      document.body.innerHTML = `
        <table>
          <caption>종합 테스트 테이블</caption>
          <thead>
            <tr>
              <th id="quarter" scope="col">분기</th>
              <th id="product" scope="colgroup" colspan="3">제품별 매출</th>
            </tr>
            <tr>
              <th headers="product" scope="col">A제품</th>
              <th headers="product" scope="col">B제품</th>
              <th headers="product" scope="col">합계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th id="q1" headers="quarter" scope="row">1분기</th>
              <td headers="q1 product">100</td>
              <td headers="q1 product">200</td>
              <td headers="q1 product">300</td>
            </tr>
            <tr>
              <th id="q2" headers="quarter" scope="row">2분기</th>
              <td headers="q2 product">150</td>
              <td headers="q2 product">250</td>
              <td headers="q2 product">400</td>
            </tr>
          </tbody>
        </table>
      `;
      const results = checkTables();
      
      // 모든 기능이 올바르게 동작해야 함
      expect(results[0].valid).toBe('pass');
      expect(results[0].headersIdAnalysis.hasHeadersIdConnections).toBe(true);
      expect(results[0].headersIdAnalysis.headerConnectionIssues).toHaveLength(0);
      expect(results[0].spanAnalysis.hasSpannedCells).toBe(true);
      expect(results[0].layoutAnalysis.isLikelyLayoutTable).toBe(false);
      expect(results[0].hasAnyLabel).toBe(true);
    });
  });
});

describe('6.1.2 초점 이동과 표시 검사: checkFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkFocus: blur() 이벤트가 있는 요소는 fail을 반환한다', () => {
    document.body.innerHTML = `
      <button onfocus="blur()">버튼1</button>
      <a href="#" onclick="blur()">링크1</a>
      <input type="text" onfocus="this.blur()" />
      <button>정상 버튼</button>
    `;
    const result = checkFocus();
    expect(result.focusIssues.length).toBe(3); // blur() 이벤트가 있는 요소만
    expect(result.focusIssues[0].issueType).toBe('blur()');
    expect(result.focusIssues[0].valid).toBe('fail');
    expect(result.focusIssues[1].issueType).toBe('blur()');
    expect(result.focusIssues[1].valid).toBe('fail');
    expect(result.focusIssues[2].issueType).toBe('blur()');
    expect(result.focusIssues[2].valid).toBe('fail');
    expect(result.summary.failureCount).toBe(3);
  });

  it('checkFocus: outline:0 스타일이 있는 요소는 warning을 반환한다', () => {
    document.body.innerHTML = `
      <button style="outline: none;">버튼1</button>
      <a href="#" style="outline: 0;">링크1</a>
      <input type="text" style="outline-width: 0;" />
      <button style="outline: 2px solid red;">정상 버튼</button>
    `;
    const result = checkFocus();
    expect(result.focusIssues.length).toBe(3); // outline 제거된 요소만
    expect(result.focusIssues[0].issueType).toBe('outline:0');
    expect(result.focusIssues[0].valid).toBe('warning');
    expect(result.focusIssues[1].issueType).toBe('outline:0');
    expect(result.focusIssues[1].valid).toBe('warning');
    expect(result.focusIssues[2].issueType).toBe('outline:0');
    expect(result.focusIssues[2].valid).toBe('warning');
    expect(result.summary.warningCount).toBe(3);
  });

  it('checkFocus: 숨겨진 요소는 검사하지 않는다', () => {
    document.body.innerHTML = `
      <button style="display: none;" onfocus="blur()">숨겨진 버튼</button>
      <a href="#" style="visibility: hidden; outline: none;">숨겨진 링크</a>
      <button onfocus="blur()">보이는 버튼</button>
    `;
    const result = checkFocus();
    expect(result.focusIssues.length).toBe(1); // 보이는 요소만 검사
    expect(result.focusIssues[0].text).toBe('보이는 버튼');
    expect(result.summary.totalIssues).toBe(1);
  });

  it('checkFocus: 정상적인 요소는 결과에 포함되지 않는다', () => {
    document.body.innerHTML = `
      <button>정상 버튼</button>
      <a href="#">정상 링크</a>
      <input type="text" />
      <select><option>옵션</option></select>
    `;
    const result = checkFocus();
    expect(result.focusIssues.length).toBe(0); // 문제가 없는 요소는 포함되지 않음
    expect(result.summary.totalIssues).toBe(0);
  });

  it('checkFocus: tabindex 패턴을 올바르게 검증한다', () => {
    document.body.innerHTML = `
      <div tabindex="1">양수 tabindex</div>
      <button tabindex="0">불필요한 tabindex</button>
      <div tabindex="invalid">잘못된 tabindex</div>
      <div tabindex="-1">올바른 음수 tabindex</div>
      <input type="text" tabindex="2" />
    `;
    const result = checkFocus();
    
    // tabindex 분석
    expect(result.tabindexAnalysis.positiveTabindex.length).toBe(2); // div, input
    expect(result.tabindexAnalysis.unnecessaryTabindex.length).toBe(1); // button
    expect(result.tabindexAnalysis.invalidTabindex.length).toBe(1); // "invalid"
    expect(result.tabindexAnalysis.hasIssues).toBe(true);
    
    // 개별 요소 이슈 검증
    expect(result.focusIssues.some(item => 
      item.issues.some((issue: string) => issue.includes('양수 tabindex'))
    )).toBe(true);
    expect(result.summary.hasTabindexIssues).toBe(true);
  });

  it('checkFocus: 키보드 트랩을 감지한다', () => {
    document.body.innerHTML = `
      <div role="dialog" style="display: block;">
        <button>버튼</button>
        <!-- 닫기 버튼이나 ESC 지원 없음 -->
      </div>
      <div role="alertdialog" class="modal" style="display: block;">
        <input type="text" />
        <button aria-label="닫기">X</button>
      </div>
    `;
    const result = checkFocus();
    
    expect(result.keyboardTraps.length).toBe(1); // 첫 번째 dialog만 트랩
    expect(result.keyboardTraps[0].role).toBe('dialog');
    expect(result.keyboardTraps[0].issues).toContain('닫기 버튼 없음');
    expect(result.keyboardTraps[0].issues).toContain('ESC 키 지원 없음');
    expect(result.summary.hasKeyboardTraps).toBe(true);
  });

  it('checkFocus: 포커스 순서를 분석한다', () => {
    document.body.innerHTML = `
      <button>첫 번째</button>
      <input tabindex="5" value="양수 tabindex" />
      <button tabindex="2">다른 양수</button>
      <a href="#">마지막</a>
    `;
    const result = checkFocus();
    
    expect(result.focusOrderAnalysis.hasPositiveTabindex).toBe(true);
    expect(result.focusOrderAnalysis.orderIssues).toContain('양수 tabindex로 인한 비논리적 탭 순서 가능성');
    expect(result.focusOrderAnalysis.totalTabbableElements).toBeGreaterThan(0);
  });

  // 확장된 통합 테스트
  it('checkFocus: 모든 기능이 통합적으로 동작한다', () => {
    document.body.innerHTML = `
      <button onfocus="blur()" tabindex="3">blur + 양수 tabindex</button>
      <a href="#" style="outline: none;">outline 제거</a>
      <div role="dialog" style="display: block;">
        <input type="text" tabindex="invalid" />
      </div>
      <button>정상 요소</button>
    `;
    const result = checkFocus();
    
    // 전체 요약 검증
    expect(result.summary.totalIssues).toBeGreaterThan(0);
    expect(result.summary.failureCount).toBe(1); // blur() 요소
    expect(result.summary.warningCount).toBeGreaterThan(0); // outline, tabindex 이슈
    expect(result.summary.hasKeyboardTraps).toBe(true);
    expect(result.summary.hasTabindexIssues).toBe(true);
    
    // 각 분석 결과 검증
    expect(result.focusIssues.length).toBeGreaterThan(0);
    expect(result.tabindexAnalysis.hasIssues).toBe(true);
    expect(result.keyboardTraps.length).toBe(1);
    expect(result.focusOrderAnalysis.hasPositiveTabindex).toBe(true);
  });
});

describe('6.4.1 반복 영역 건너뛰기 검사: checkSkipNav', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkSkipNav: href가 #id로 연결되어 있고, 해당 id가 존재하면 pass, 없으면 fail', () => {
    document.body.innerHTML = `
      <a href="#main">메인 바로가기</a>
      <a href="#content">본문 바로가기</a>
      <a href="#none">없는 곳 바로가기</a>
      <div id="main"></div>
      <div id="content"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('pass');
    expect(results[2].valid).toBe('fail');
    expect(results[0].connected).toBe(true);
    expect(results[2].connected).toBe(false);
  });

  it('checkSkipNav: href가 #만 있으면 무조건 fail', () => {
    document.body.innerHTML = `
      <a href="#">잘못된 바로가기</a>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('fail');
    expect(results[0].connected).toBe(false);
  });

  it('checkSkipNav: href가 #id인데, 해당 id 대신 name 속성이 있는 경우도 pass', () => {
    document.body.innerHTML = `
      <a href="#target">네임 바로가기</a>
      <div name="target"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].valid).toBe('pass');
    expect(results[0].connected).toBe(true);
  });

  it('checkSkipNav: href가 #id가 아닌 경우(null 반환)', () => {
    document.body.innerHTML = `
      <a href="/main">일반 링크</a>
      <a href="javascript:void(0)">JS 링크</a>
      <a>링크 없음</a>
    `;
    const results = checkSkipNav();
    expect(results.length).toBe(0);
  });

  it('checkSkipNav: 20개 초과 링크가 있어도 20개까지만 검사한다', () => {
    let html = '';
    for (let i = 0; i < 25; i++) {
      html += `<a href="#id${i}">${i}번째</a>`;
    }
    for (let i = 0; i < 20; i++) {
      html += `<div id="id${i}"></div>`;
    }
    document.body.innerHTML = html;
    const results = checkSkipNav();
    expect(results.length).toBe(20);
    expect(results.every((r) => r.valid === 'pass')).toBe(true);
  });

  it('checkSkipNav: a 태그에 innerText가 없을 때도 정상적으로 value가 생성된다', () => {
    document.body.innerHTML = `
      <a href="#main"></a>
      <div id="main"></div>
    `;
    const results = checkSkipNav();
    expect(results[0].value).toContain('(#main)');
  });
});

describe('6.4.2 제목 제공 - 페이지 검사: checkPageTitle', () => {
  afterEach(() => {
    document.title = '';
  });
  it('checkPageTitle: title이 있고 중복 특수문자가 없으면 pass', () => {
    document.title = '정상 타이틀';
    const result = checkPageTitle();
    expect(result.valid).toBe('pass');
  });
  it('checkPageTitle: title이 없으면 fail', () => {
    document.title = '';
    const result = checkPageTitle();
    expect(result.valid).toBe('fail');
  });
  it('checkPageTitle: 중복 특수문자가 있으면 fail', () => {
    document.title = '중복::타이틀';
    const result = checkPageTitle();
    expect(result.valid).toBe('fail');
  });
});

describe('6.4.2 제목 제공 - 프레임 검사: checkFrames', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkFrames: title이 있는 iframe은 pass, 없으면 fail', () => {
    document.body.innerHTML = `
      <iframe src="a.html" title="프레임"></iframe>
      <iframe src="b.html"></iframe>
    `;
    const results = checkFrames();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('fail');
  });
});

describe('6.4.2 제목 제공 - 콘텐츠 블록 검사: checkHeadings', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkHeadings: h1~h6 태그가 모두 반환되고, 항상 pass', () => {
    document.body.innerHTML = `
      <h1>제목1</h1><h2>제목2</h2><h3>제목3</h3><h4>제목4</h4><h5>제목5</h5><h6>제목6</h6>
    `;
    const results = checkHeadings();
    expect(results.length).toBe(6);
    expect(results.every((r) => r.valid === 'pass')).toBe(true);
  });
});

describe('7.1.1 기본 언어 표시 검사: checkPageLang', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('xmlns');
    document.documentElement.removeAttribute('xml:lang');
  });
  it('checkPageLang: lang 속성이 있으면 pass, 없으면 fail', () => {
    document.documentElement.setAttribute('lang', 'ko');
    let results = checkPageLang();
    expect(results[0].valid).toBe('pass');
    document.documentElement.removeAttribute('lang');
    results = checkPageLang();
    expect(results[0].valid).toBe('fail');
  });
  it('checkPageLang: xhtml에서 lang, xml:lang 모두 있으면 pass', () => {
    document.documentElement.setAttribute(
      'xmlns',
      'http://www.w3.org/1999/xhtml',
    );
    document.documentElement.setAttribute('lang', 'ko');
    document.documentElement.setAttribute('xml:lang', 'ko');
    const results = checkPageLang();
    expect(results[0].valid).toBe('pass');
    expect(results[0].value).toContain('xml:lang=ko');
    expect(results[0].value).toContain('lang=ko');
  });
  it('checkPageLang: xhtml에서 xml:lang만 있으면 warning', () => {
    document.documentElement.setAttribute(
      'xmlns',
      'http://www.w3.org/1999/xhtml',
    );
    document.documentElement.removeAttribute('lang');
    document.documentElement.setAttribute('xml:lang', 'en');
    const results = checkPageLang();
    expect(results[0].valid).toBe('warning');
    expect(results[0].value).toContain('xml:lang=en');
  });
  it('checkPageLang: xhtml에서 lang만 있으면 pass', () => {
    document.documentElement.setAttribute(
      'xmlns',
      'http://www.w3.org/1999/xhtml',
    );
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.removeAttribute('xml:lang');
    const results = checkPageLang();
    expect(results[0].valid).toBe('pass');
    expect(results[0].value).toContain('lang=en');
  });
});

describe('7.2.1 사용자 요구에 따른 실행 검사: checkUserRequest', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('checkUserRequest: window.open이 있는 요소만 결과에 포함되고, 적절한 valid 값이 반환된다', () => {
    document.body.innerHTML = `
      <a href="http://naver.com" onclick="window.open(this.href);return false;">링크</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;" title="새창">링크</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;" target="_blank">링크</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;" title="새창" target="_blank">링크</a>
      <a href="http://naver.com">일반 링크</a>
      <button onclick="alert('test')">일반 버튼</button>
    `;
    const results = checkUserRequest() as Array<{ valid: string }>;
    expect(results.length).toBe(4); // window.open이 있는 요소만 포함
    expect(results[0].valid).toBe('fail'); // title 없음
    expect(results[1].valid).toBe('pass'); // title 있음
    expect(results[2].valid).toBe('pass'); // target="_blank"
    expect(results[3].valid).toBe('pass'); // title과 target="_blank" 모두 있음
  });

  it('checkUserRequest: textContent에 새창, 팝업, new win이 있으면 pass', () => {
    document.body.innerHTML = `
      <a href="http://naver.com" onclick="window.open(this.href);return false;">새창으로 열기</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;">팝업 열기</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;">New Win</a>
      <a href="http://naver.com" onclick="window.open(this.href);return false;">일반 링크</a>
    `;
    const results = checkUserRequest() as Array<{ valid: string }>;
    expect(results.length).toBe(4);
    expect(results[0].valid).toBe('pass'); // "새창" 포함
    expect(results[1].valid).toBe('pass'); // "팝업" 포함
    expect(results[2].valid).toBe('pass'); // "new win" 포함
    expect(results[3].valid).toBe('fail'); // 특별한 텍스트 없음
  });

  it('checkUserRequest: window.open이 없는 요소는 결과에 포함되지 않는다', () => {
    document.body.innerHTML = `
      <a href="http://naver.com">일반 링크</a>
      <button onclick="alert('test')">일반 버튼</button>
      <input type="button" value="버튼" onclick="console.log('test')" />
      <area shape="rect" coords="0,0,100,100" href="http://naver.com" />
    `;
    const results = checkUserRequest();
    expect(results.length).toBe(0); // window.open이 없는 요소는 포함되지 않음
  });

  it('checkUserRequest: 결과 객체에 필요한 속성들이 포함된다', () => {
    document.body.innerHTML = `
      <a href="http://naver.com" onclick="window.open(this.href);return false;" title="새창" target="_blank">링크</a>
    `;
    const results = checkUserRequest() as Array<{
      tag: string;
      title: string;
      target: string;
      text: string;
      valid: string;
    }>;
    expect(results.length).toBe(1);
    expect(results[0]).toHaveProperty('tag', 'a');
    expect(results[0]).toHaveProperty('title', '새창');
    expect(results[0]).toHaveProperty('target', '_blank');
    expect(results[0]).toHaveProperty('text', '링크');
    expect(results[0]).toHaveProperty('valid', 'pass');
  });
});

describe('7.3.2 레이블 제공 검사: checkInputLabels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('checkInputLabels: label 연결시 pass, title만 있으면 warning, 둘 다 없으면 fail', () => {
    document.body.innerHTML = `
      <label for="a">라벨</label><input id="a">
      <input id="b" title="타이틀">
      <input id="c">
    `;
    const results = checkInputLabels();
    expect(results[0].valid).toBe('pass');
    expect(results[1].valid).toBe('warning');
    expect(results[2].valid).toBe('fail');
  });
  it('checkInputLabels: 부모 label로 연결된 경우도 pass', () => {
    document.body.innerHTML = `<label>부모<input id="d"></label>`;
    const results = checkInputLabels();
    expect(results[0].valid).toBe('pass');
  });
});

describe('8.2.1 웹 애플리케이션 접근성 준수: checkWebApplication', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('탭 인터페이스 검사', () => {
    it('tablist 내부에 tab이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const tablistResult = results.find((r) => r.interface === 'tablist');
      expect(tablistResult?.valid).toBe('fail');
      expect(tablistResult?.issues).toContain('tablist 내부에 tab role이 없음');
    });

    it('tab이 있지만 tabpanel이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-controls="panel1">탭1</div>
          <div role="tab" aria-controls="panel2">탭2</div>
        </div>
      `;
      const results = checkWebApplication();
      const tablistResult = results.find((r) => r.interface === 'tablist');
      expect(tablistResult?.valid).toBe('fail');
      expect(tablistResult?.issues).toContain(
        'tab role이 있지만 연결된 tabpanel이 없음',
      );
    });

    it('tab과 tabpanel의 수가 맞지 않으면 warning', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-controls="panel1">탭1</div>
          <div role="tab" aria-controls="panel2">탭2</div>
        </div>
        <div role="tabpanel" id="panel1">패널1</div>
      `;
      const results = checkWebApplication();
      const tablistResult = results.find((r) => r.interface === 'tablist');
      expect(tablistResult?.valid).toBe('warning');
      expect(tablistResult?.issues).toContain(
        'tab(2)과 연결된 tabpanel(1)의 수가 일치하지 않음',
      );
    });

    it('tab과 tabpanel이 올바르게 구성되면 pass', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-controls="panel1">탭1</div>
          <div role="tab" aria-controls="panel2">탭2</div>
        </div>
        <div role="tabpanel" id="panel1">패널1</div>
        <div role="tabpanel" id="panel2">패널2</div>
      `;
      const results = checkWebApplication();
      const tablistResult = results.find((r) => r.interface === 'tablist');
      expect(tablistResult?.valid).toBe('pass');
      expect(tablistResult?.tabs).toBe(2);
      expect(tablistResult?.tabpanels).toBe(2);
    });
  });

  describe('메뉴 인터페이스 검사', () => {
    it('menubar 내부에 menuitem이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="menubar">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const menubarResult = results.find((r) => r.interface === 'menubar');
      expect(menubarResult?.valid).toBe('fail');
      expect(menubarResult?.issues).toContain(
        'menu/menubar 내부에 menuitem이 없음',
      );
    });

    it('menu 내부에 menuitem이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="menu">
          <div role="menuitem">메뉴1</div>
          <div role="menuitem">메뉴2</div>
        </div>
      `;
      const results = checkWebApplication();
      const menuResult = results.find((r) => r.interface === 'menu');
      expect(menuResult?.valid).toBe('pass');
      expect(menuResult?.menuitems).toBe(2);
    });

    it('menuitemcheckbox와 menuitemradio도 인식한다', () => {
      document.body.innerHTML = `
        <div role="menu">
          <div role="menuitemcheckbox">체크박스 메뉴</div>
          <div role="menuitemradio">라디오 메뉴</div>
        </div>
      `;
      const results = checkWebApplication();
      const menuResult = results.find((r) => r.interface === 'menu');
      expect(menuResult?.valid).toBe('pass');
      expect(menuResult?.menuitemcheckboxes).toBe(1);
      expect(menuResult?.menuitemradios).toBe(1);
    });
  });

  describe('콤보 박스 인터페이스 검사', () => {
    it('combobox와 연결된 listbox가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="combobox">
          <input type="text" />
        </div>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('fail');
      expect(comboboxResult?.issues).toContain(
        'combobox와 연결된 listbox가 없음',
      );
    });

    it('listbox가 있지만 option이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="combobox">
          <input type="text" />
          <div role="listbox">
            <div>일반 요소</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('fail');
      expect(comboboxResult?.issues).toContain(
        'listbox가 있지만 option이 없음',
      );
    });

    it('combobox, listbox, option이 올바르게 구성되면 pass', () => {
      document.body.innerHTML = `
        <div role="combobox">
          <input type="text" />
          <div role="listbox">
            <div role="option">옵션1</div>
            <div role="option">옵션2</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('pass');
      expect(comboboxResult?.hasListbox).toBe(true);
      expect(comboboxResult?.options).toBe(2);
    });

    it('aria-controls로 외부 listbox와 연결된 combobox는 pass', () => {
      document.body.innerHTML = `
        <input role="combobox" aria-controls="listbox1" />
        <ul id="listbox1" role="listbox">
          <li role="option">옵션1</li>
          <li role="option">옵션2</li>
        </ul>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('pass');
      expect(comboboxResult?.hasListbox).toBe(true);
      expect(comboboxResult?.options).toBe(2);
    });

    it('aria-controls가 listbox가 아닌 요소를 참조하면 fail', () => {
      document.body.innerHTML = `
        <input role="combobox" aria-controls="notlistbox" />
        <div id="notlistbox">일반 요소</div>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('fail');
      expect(comboboxResult?.issues).toContain(
        'combobox와 연결된 listbox가 없음',
      );
    });
  });

  describe('그리드/표 인터페이스 검사', () => {
    it('grid 내부에 row가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="grid">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const gridResult = results.find((r) => r.interface === 'grid');
      expect(gridResult?.valid).toBe('fail');
      expect(gridResult?.issues).toContain('grid/table 내부에 row가 없음');
    });

    it('모든 row에 cell이나 header가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="grid">
          <div role="row">
            <div>일반 요소</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const gridResult = results.find((r) => r.interface === 'grid');
      expect(gridResult?.valid).toBe('fail');
      expect(gridResult?.issues).toContain('모든 row에 cell이나 header가 없음');
    });

    it('grid가 올바르게 구성되면 pass', () => {
      document.body.innerHTML = `
        <div role="grid">
          <div role="row">
            <div role="columnheader">헤더1</div>
            <div role="columnheader">헤더2</div>
          </div>
          <div role="row">
            <div role="cell">셀1</div>
            <div role="cell">셀2</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const gridResult = results.find((r) => r.interface === 'grid');
      expect(gridResult?.valid).toBe('pass');
      expect(gridResult?.rows).toBe(2);
      expect(gridResult?.cells).toBe(2);
      expect(gridResult?.columnheaders).toBe(2);
    });

    it('table role도 동일하게 검사한다', () => {
      document.body.innerHTML = `
        <div role="table">
          <div role="row">
            <div role="rowheader">행헤더</div>
            <div role="cell">셀</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const tableResult = results.find((r) => r.interface === 'table');
      expect(tableResult?.valid).toBe('pass');
      expect(tableResult?.rowheaders).toBe(1);
    });

    it('헤더만 있는 grid도 유효한 구조로 pass', () => {
      document.body.innerHTML = `
        <div role="grid">
          <div role="row">
            <div role="columnheader">이름</div>
            <div role="columnheader">이메일</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const gridResult = results.find((r) => r.interface === 'grid');
      expect(gridResult?.valid).toBe('pass');
      expect(gridResult?.columnheaders).toBe(2);
      expect(gridResult?.cells).toBe(0);
    });
  });

  describe('트리 뷰 인터페이스 검사', () => {
    it('tree 내부에 treeitem이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="tree">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const treeResult = results.find((r) => r.interface === 'tree');
      expect(treeResult?.valid).toBe('fail');
      expect(treeResult?.issues).toContain('tree 내부에 treeitem이 없음');
    });

    it('tree가 올바르게 구성되면 pass', () => {
      document.body.innerHTML = `
        <div role="tree">
          <div role="treeitem">아이템1</div>
          <div role="group">
            <div role="treeitem">아이템2</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const treeResult = results.find((r) => r.interface === 'tree');
      expect(treeResult?.valid).toBe('pass');
      expect(treeResult?.treeitems).toBe(2);
      expect(treeResult?.groups).toBe(1);
    });
  });

  describe('다이얼로그 인터페이스 검사', () => {
    it('dialog에 제목이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="dialog">
          <div>내용</div>
        </div>
      `;
      const results = checkWebApplication();
      const dialogResult = results.find((r) => r.interface === 'dialog');
      expect(dialogResult?.valid).toBe('fail');
      expect(dialogResult?.issues).toContain(
        'dialog에 제목(aria-labelledby, aria-label, heading)이 없음',
      );
    });

    it('aria-labelledby가 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="dialog" aria-labelledby="dialog-title">
          <h2 id="dialog-title">다이얼로그 제목</h2>
          <div>내용</div>
        </div>
      `;
      const results = checkWebApplication();
      const dialogResult = results.find((r) => r.interface === 'dialog');
      expect(dialogResult?.valid).toBe('pass');
      expect(dialogResult?.hasTitle).toBe(true);
    });

    it('aria-label이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="dialog" aria-label="다이얼로그 제목">
          <div>내용</div>
        </div>
      `;
      const results = checkWebApplication();
      const dialogResult = results.find((r) => r.interface === 'dialog');
      expect(dialogResult?.valid).toBe('pass');
    });

    it('heading role이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="dialog">
          <div role="heading">다이얼로그 제목</div>
          <div>내용</div>
        </div>
      `;
      const results = checkWebApplication();
      const dialogResult = results.find((r) => r.interface === 'dialog');
      expect(dialogResult?.valid).toBe('pass');
    });

    it('alertdialog도 동일하게 검사한다', () => {
      document.body.innerHTML = `
        <div role="alertdialog" aria-label="알림">
          <div>내용</div>
        </div>
      `;
      const results = checkWebApplication();
      const alertdialogResult = results.find(
        (r) => r.interface === 'alertdialog',
      );
      expect(alertdialogResult?.valid).toBe('pass');
    });
  });

  describe('툴바 인터페이스 검사', () => {
    it('toolbar 내부에 상호작용 요소가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="toolbar">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const toolbarResult = results.find((r) => r.interface === 'toolbar');
      expect(toolbarResult?.valid).toBe('fail');
      expect(toolbarResult?.issues).toContain(
        'toolbar 내부에 상호작용 요소(button, link, input)가 없음',
      );
    });

    it('button이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="toolbar">
          <button>버튼1</button>
          <button>버튼2</button>
        </div>
      `;
      const results = checkWebApplication();
      const toolbarResult = results.find((r) => r.interface === 'toolbar');
      expect(toolbarResult?.valid).toBe('pass');
      expect(toolbarResult?.buttons).toBe(2);
    });

    it('link가 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="toolbar">
          <a href="#">링크1</a>
          <a href="#">링크2</a>
        </div>
      `;
      const results = checkWebApplication();
      const toolbarResult = results.find((r) => r.interface === 'toolbar');
      expect(toolbarResult?.valid).toBe('pass');
      expect(toolbarResult?.links).toBe(2);
    });

    it('input이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="toolbar">
          <input type="text" />
          <input type="button" value="버튼" />
        </div>
      `;
      const results = checkWebApplication();
      const toolbarResult = results.find((r) => r.interface === 'toolbar');
      expect(toolbarResult?.valid).toBe('pass');
      expect(toolbarResult?.inputs).toBe(2);
    });

    it('role="button"도 인식한다', () => {
      document.body.innerHTML = `
        <div role="toolbar">
          <div role="button">버튼</div>
        </div>
      `;
      const results = checkWebApplication();
      const toolbarResult = results.find((r) => r.interface === 'toolbar');
      expect(toolbarResult?.valid).toBe('pass');
      expect(toolbarResult?.buttons).toBe(1);
    });
  });

  describe('리스트 박스 인터페이스 검사', () => {
    it('listbox 내부에 option이 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="listbox">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const listboxResult = results.find((r) => r.interface === 'listbox');
      expect(listboxResult?.valid).toBe('fail');
      expect(listboxResult?.issues).toContain('listbox 내부에 option이 없음');
    });

    it('listbox에 option이 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="listbox" aria-label="과일 선택">
          <div role="option">사과</div>
          <div role="option">바나나</div>
          <div role="option">오렌지</div>
        </div>
      `;
      const results = checkWebApplication();
      const listboxResult = results.find((r) => r.interface === 'listbox');
      expect(listboxResult?.valid).toBe('pass');
      expect(listboxResult?.options).toBe(3);
      expect(listboxResult?.groups).toBe(0);
    });

    it('group을 사용한 listbox도 pass', () => {
      document.body.innerHTML = `
        <div role="listbox" aria-label="음식 선택">
          <div role="group" aria-label="과일">
            <div role="option">사과</div>
            <div role="option">바나나</div>
          </div>
          <div role="group" aria-label="채소">
            <div role="option">당근</div>
            <div role="option">브로콜리</div>
          </div>
        </div>
      `;
      const results = checkWebApplication();
      const listboxResult = results.find((r) => r.interface === 'listbox');
      expect(listboxResult?.valid).toBe('pass');
      expect(listboxResult?.options).toBe(4);
      expect(listboxResult?.groups).toBe(2);
    });
  });

  describe('라디오 그룹 인터페이스 검사', () => {
    it('radiogroup 내부에 radio가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="radiogroup" aria-label="성별">
          <div>일반 요소</div>
        </div>
      `;
      const results = checkWebApplication();
      const radiogroupResult = results.find((r) => r.interface === 'radiogroup');
      expect(radiogroupResult?.valid).toBe('fail');
      expect(radiogroupResult?.issues).toContain('radiogroup 내부에 radio가 없음');
    });

    it('radiogroup에 radio가 있으면 pass', () => {
      document.body.innerHTML = `
        <div role="radiogroup" aria-label="성별">
          <div role="radio" aria-checked="true">남성</div>
          <div role="radio" aria-checked="false">여성</div>
          <div role="radio" aria-checked="false">기타</div>
        </div>
      `;
      const results = checkWebApplication();
      const radiogroupResult = results.find((r) => r.interface === 'radiogroup');
      expect(radiogroupResult?.valid).toBe('pass');
      expect(radiogroupResult?.radios).toBe(3);
    });
  });

  describe('복합 인터페이스 검사', () => {
    it('여러 인터페이스가 동시에 존재할 때 모두 검사한다', () => {
      document.body.innerHTML = `
        <div role="tablist">
          <div role="tab" aria-controls="panel1">탭1</div>
        </div>
        <div role="tabpanel" id="panel1">패널1</div>
        <div role="menu">
          <div role="menuitem">메뉴1</div>
        </div>
        <div role="dialog" aria-label="다이얼로그">
          <div>내용</div>
        </div>
        <div role="listbox">
          <div role="option">옵션1</div>
        </div>
        <div role="radiogroup" aria-label="선택">
          <div role="radio">라디오1</div>
        </div>
      `;
      const results = checkWebApplication();
      expect(results.length).toBe(5);

      const tablistResult = results.find((r) => r.interface === 'tablist');
      const menuResult = results.find((r) => r.interface === 'menu');
      const dialogResult = results.find((r) => r.interface === 'dialog');
      const listboxResult = results.find((r) => r.interface === 'listbox');
      const radiogroupResult = results.find((r) => r.interface === 'radiogroup');

      expect(tablistResult?.valid).toBe('pass');
      expect(menuResult?.valid).toBe('pass');
      expect(dialogResult?.valid).toBe('pass');
      expect(listboxResult?.valid).toBe('pass');
      expect(radiogroupResult?.valid).toBe('pass');
    });

    it('인터페이스가 없으면 빈 배열을 반환한다', () => {
      document.body.innerHTML = `
        <div>일반 요소</div>
        <span>일반 텍스트</span>
      `;
      const results = checkWebApplication();
      expect(results.length).toBe(0);
    });
  });
});
