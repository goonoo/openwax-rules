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
    expect(results[2].valid).toBe('warning');
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
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: 'none',
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('b.png')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
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
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
    });
    const results = checkBgImages();
    expect(results[0].alt).toBe('라벨');
    expect(results[1].alt).toBe('타이틀');
    expect(results[2].alt).toBe('');
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
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('a.jpg')",
          display: 'none',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'hidden',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: "url('c.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
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
    jest.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const id = el.id;
      if (id === 'bg1')
        return {
          backgroundImage: "url('/a.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg2')
        return {
          backgroundImage: "url('b.jpg')",
          display: 'block',
          visibility: 'visible',
        } as any;
      if (id === 'bg3')
        return {
          backgroundImage: 'url()',
          display: 'block',
          visibility: 'visible',
        } as any;
      return {
        backgroundImage: 'none',
        display: 'block',
        visibility: 'visible',
      } as any;
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
  it('checkTables: caption, summary, scope 있는 th 모두 없으면 warning', () => {
    document.body.innerHTML = `<table><thead><tr><td>데이터</td></tr></thead></table>`;
    const results = checkTables();
    expect(results[0].valid).toBe('warning');
  });
  it('checkTables: 그 외는 fail', () => {
    document.body.innerHTML = `<table><thead><tr><th>헤더</th></tr></thead></table>`;
    const results = checkTables();
    expect(results[0].valid).toBe('fail');
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
    const results = checkFocus() as Array<{
      tag: string;
      text: string;
      issueType: string;
      valid: string;
    }>;
    expect(results.length).toBe(3); // blur() 이벤트가 있는 요소만
    expect(results[0].issueType).toBe('blur()');
    expect(results[0].valid).toBe('fail');
    expect(results[1].issueType).toBe('blur()');
    expect(results[1].valid).toBe('fail');
    expect(results[2].issueType).toBe('blur()');
    expect(results[2].valid).toBe('fail');
  });

  it('checkFocus: outline:0 스타일이 있는 요소는 fail을 반환한다', () => {
    document.body.innerHTML = `
      <button style="outline: none;">버튼1</button>
      <a href="#" style="outline: 0;">링크1</a>
      <input type="text" style="outline-width: 0;" />
      <button style="outline: 2px solid red;">정상 버튼</button>
    `;
    const results = checkFocus() as Array<{
      tag: string;
      text: string;
      issueType: string;
      valid: string;
    }>;
    expect(results.length).toBe(3); // outline 제거된 요소만
    expect(results[0].issueType).toBe('outline:0');
    expect(results[0].valid).toBe('fail');
    expect(results[1].issueType).toBe('outline:0');
    expect(results[1].valid).toBe('fail');
    expect(results[2].issueType).toBe('outline:0');
    expect(results[2].valid).toBe('fail');
  });

  it('checkFocus: 숨겨진 요소는 검사하지 않는다', () => {
    document.body.innerHTML = `
      <button style="display: none;" onfocus="blur()">숨겨진 버튼</button>
      <a href="#" style="visibility: hidden;" style="outline: none;">숨겨진 링크</a>
      <button onfocus="blur()">보이는 버튼</button>
    `;
    const results = checkFocus() as Array<{
      tag: string;
      text: string;
      issueType: string;
      valid: string;
    }>;
    expect(results.length).toBe(1); // 보이는 요소만 검사
    expect(results[0].text).toBe('보이는 버튼');
  });

  it('checkFocus: 정상적인 요소는 결과에 포함되지 않는다', () => {
    document.body.innerHTML = `
      <button>정상 버튼</button>
      <a href="#">정상 링크</a>
      <input type="text" />
      <select><option>옵션</option></select>
    `;
    const results = checkFocus();
    expect(results.length).toBe(0); // 문제가 없는 요소는 포함되지 않음
  });

  it('checkFocus: 문제가 있는 모든 요소가 결과에 포함된다', () => {
    document.body.innerHTML = `
      <div onfocus="blur()">div는 포커스 불가</div>
      <span style="outline: none;">span도 포커스 불가</span>
      <button onfocus="blur()">포커스 가능한 버튼</button>
      <a href="#" style="outline: none;">포커스 가능한 링크</a>
    `;
    const results = checkFocus() as Array<{
      tag: string;
      text: string;
      issueType: string;
      valid: string;
    }>;
    expect(results.length).toBe(4); // 모든 문제가 있는 요소가 포함됨
    expect(results.some((r) => r.tag === 'div')).toBe(true);
    expect(results.some((r) => r.tag === 'span')).toBe(true);
    expect(results.some((r) => r.tag === 'button')).toBe(true);
    expect(results.some((r) => r.tag === 'a')).toBe(true);
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
    it('combobox 내부에 listbox가 없으면 fail', () => {
      document.body.innerHTML = `
        <div role="combobox">
          <input type="text" />
        </div>
      `;
      const results = checkWebApplication();
      const comboboxResult = results.find((r) => r.interface === 'combobox');
      expect(comboboxResult?.valid).toBe('fail');
      expect(comboboxResult?.issues).toContain(
        'combobox 내부에 listbox가 없음',
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

    it('row가 있지만 cell이 없으면 fail', () => {
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
      expect(gridResult?.issues).toContain('row가 있지만 cell이 없음');
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
      `;
      const results = checkWebApplication();
      expect(results.length).toBe(3);

      const tablistResult = results.find((r) => r.interface === 'tablist');
      const menuResult = results.find((r) => r.interface === 'menu');
      const dialogResult = results.find((r) => r.interface === 'dialog');

      expect(tablistResult?.valid).toBe('pass');
      expect(menuResult?.valid).toBe('pass');
      expect(dialogResult?.valid).toBe('pass');
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
