(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const concepts = window.CONCEPTS;
  const sources = {
    apple: {
      name: 'Apple / macOS Sonoma',
      url: 'https://www.apple.com/newsroom/2023/06/macos-sonoma-brings-new-capabilities-for-elevating-productivity-and-creativity/',
    },
    chronolog: {
      name: 'Chronolog / Keffi Studio',
      url: 'https://dribbble.com/shots/25038317-Chronolog-Time-tracker-widget-macOS',
    },
    ngetrek: {
      name: 'Ngetrek / Keitoto',
      url: 'https://dribbble.com/shots/20064326-Ngetrek-Time-Tracking-Widget-macOS',
    },
    pixel: { name: 'Minimal Pixel / Ben Miles', url: 'https://github.com/ben-miles/Minimal-Pixel' },
  };
  let current = concepts.find((c) => c.id === location.hash.slice(1)) || concepts[2];
  let wallpaper = 'dusk',
    showWindow = false,
    showIcons = true,
    width = 1440,
    height = 900;
  let reviews = { favorites: [], notes: {} };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem('ubersicht-desktop-review-v1'));
    if (saved && Array.isArray(saved.favorites) && saved.notes && typeof saved.notes === 'object') {
      reviews.favorites = saved.favorites.filter((id) => concepts.some((c) => c.id === id));
      reviews.notes = saved.notes;
    }
  } catch {
    storageAvailable = false;
  }
  function save() {
    try {
      localStorage.setItem('ubersicht-desktop-review-v1', JSON.stringify(reviews));
      $('saved-status').textContent = '已保存在当前浏览器';
    } catch {
      storageAvailable = false;
      $('saved-status').textContent = '仅在本页保留，请复制评审结果';
    }
  }
  function toast(text) {
    const element = $('toast');
    element.textContent = text;
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      element.hidden = true;
    }, 2200);
  }
  function shortlist() {
    const node = $('shortlist');
    node.replaceChildren();
    if (!reviews.favorites.length) {
      const span = document.createElement('span');
      span.className = 'empty-state';
      span.textContent = '点击「收藏方向」，把候选放在这里比较。';
      node.append(span);
    } else {
      reviews.favorites.forEach((id) => {
        const c = concepts.find((c) => c.id === id);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = c.n + ' ' + c.name;
        button.addEventListener('click', () => select(id));
        node.append(button);
      });
    }
    const selected = reviews.favorites.includes(current.id);
    $('favorite').setAttribute('aria-pressed', String(selected));
    $('favorite').textContent = selected ? '★ 已收藏' : '☆ 收藏方向';
  }
  function fit() {
    const box = $('stage-viewport');
    box.style.aspectRatio = width + '/' + height;
    const scale = Math.min(box.clientWidth / width, box.clientHeight / height);
    const frame = $('stage-frame');
    frame.style.width = width * scale + 'px';
    frame.style.height = height * scale + 'px';
    const iframe = $('preview');
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    iframe.style.transform = `scale(${scale})`;
    $('scale-label').textContent = `· ${Math.round(scale * 100)}%`;
  }
  function href() {
    return `${current.id}.html?wallpaper=${wallpaper}&window=${showWindow ? 'on' : 'off'}&icons=${showIcons ? 'on' : 'off'}`;
  }
  function refresh() {
    const url = href();
    $('preview').src = url;
    $('full-preview').href = url;
    fit();
  }
  function select(id) {
    const concept = concepts.find((c) => c.id === id);
    if (!concept) return;
    current = concept;
    history.replaceState(null, '', '#' + id);
    document.title = concept.n + ' ' + concept.name + ' / 留白';
    $('detail-number').textContent = 'DIRECTION ' + concept.n;
    $('detail-name').textContent = concept.name;
    $('detail-zh').textContent = concept.zh;
    $('recommend-badge').hidden = !concept.recommended;
    $('description').textContent = concept.description;
    $('tradeoff').textContent = concept.tradeoff;
    $('implementation').textContent = concept.implementation;
    $('widget-size').textContent = concept.size;
    $('placement').textContent = concept.form;
    $('review-note').value = typeof reviews.notes[id] === 'string' ? reviews.notes[id] : '';
    const source = sources[concept.ref];
    $('source-link').href = source.url;
    $('source-link').textContent = source.name + ' ↗';
    document
      .querySelectorAll('[data-concept-id]')
      .forEach((node) => node.setAttribute('aria-current', String(node.dataset.conceptId === id)));
    $('footprint').textContent = '…';
    shortlist();
    refresh();
  }
  // Union of rectangles, ignoring shadows and transparent interior pixels.
  function unionArea(rects) {
    const xs = [...new Set(rects.flatMap((r) => [r.left, r.right]))].sort((a, b) => a - b);
    let area = 0;
    for (let i = 1; i < xs.length; i++) {
      const a = xs[i - 1],
        b = xs[i];
      const ys = rects
        .filter((r) => r.left < b && r.right > a)
        .map((r) => [r.top, r.bottom])
        .sort((a, b) => a[0] - b[0]);
      let total = 0,
        start = null,
        end = null;
      for (const [top, bottom] of ys) {
        if (start === null) {
          start = top;
          end = bottom;
        } else if (top <= end) {
          end = Math.max(end, bottom);
        } else {
          total += end - start;
          start = top;
          end = bottom;
        }
      }
      if (start !== null) total += end - start;
      area += (b - a) * total;
    }
    return area;
  }
  function measure() {
    try {
      const doc = $('preview').contentDocument;
      const rects = [...doc.querySelectorAll('.widget')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            left: Math.max(0, r.left),
            right: Math.min(width, r.right),
            top: Math.max(0, r.top),
            bottom: Math.min(height, r.bottom),
          };
        })
        .filter((r) => r.right > r.left && r.bottom > r.top);
      const percentage = (unionArea(rects) / (width * height)) * 100;
      $('footprint').innerHTML = percentage.toFixed(1) + '<small>%</small>';
      $('footprint').title = '组件矩形面积 / 模拟屏幕面积，不含阴影';
    } catch {
      $('footprint').textContent = '独立预览';
    }
  }
  const shapes = [
    [[2, 79, 40, 10]],
    [[2.5, 9, 17, 31]],
    [[2, 64, 19.5, 25]],
    [[2, 5.3, 51.4, 6]],
    [
      [2, 71, 17.2, 17.3],
      [77.5, 71, 14.7, 17.3],
    ],
    [[2, 7, 17, 27]],
    [[74.2, 7, 18, 34.7]],
    [
      [2, 83, 16, 5.1],
      [18.6, 83, 10.4, 5.1],
      [29.7, 83, 11.1, 5.1],
    ],
    [[2, 7, 20.3, 21.8]],
    [[2.5, 76, 24.7, 11.5]],
  ];
  concepts.forEach((c, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'concept-nav-item';
    button.dataset.conceptId = c.id;
    button.setAttribute('aria-label', c.n + ' ' + c.name + ' ' + c.zh);
    button.innerHTML = `<span class="nav-number">${c.n}</span><span><span class="nav-name">${c.name}</span><span class="nav-zh">${c.zh}</span></span>${c.recommended ? '<span class="nav-star" title="推荐候选">✳</span>' : ''}`;
    button.addEventListener('click', () => select(c.id));
    $('concept-nav').append(button);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'overview-card';
    card.dataset.conceptId = c.id;
    card.innerHTML = `<div class="overview-art"><div class="mini-menu"></div><div class="mini-dock"></div>${shapes[index].map(([x, y, w, h]) => `<span class="shape" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;${index === 7 ? 'border-radius:12px' : ''}"></span>`).join('')}</div><div class="overview-caption"><b><span>${c.n}</span>${c.name}</b><small>${c.zh} / ${c.tier}</small></div>`;
    card.addEventListener('click', () => {
      select(c.id);
      $('stage-viewport').scrollIntoView({ behavior: 'auto', block: 'center' });
    });
    $('overview-grid').append(card);
  });
  document.querySelectorAll('[data-wallpaper]').forEach((button) =>
    button.addEventListener('click', () => {
      wallpaper = button.dataset.wallpaper;
      document
        .querySelectorAll('[data-wallpaper]')
        .forEach((node) => node.setAttribute('aria-pressed', String(node === button)));
      $('wallpaper-label').textContent = { dusk: '暮色', sand: '沙丘', cobalt: '复杂背景' }[
        wallpaper
      ];
      refresh();
    }),
  );
  $('window-toggle').addEventListener('click', () => {
    showWindow = !showWindow;
    $('window-toggle').setAttribute('aria-pressed', String(showWindow));
    $('window-toggle').classList.toggle('active', showWindow);
    refresh();
  });
  $('icons-toggle').addEventListener('click', () => {
    showIcons = !showIcons;
    $('icons-toggle').setAttribute('aria-pressed', String(showIcons));
    $('icons-toggle').classList.toggle('active', showIcons);
    refresh();
  });
  $('resolution').addEventListener('change', () => {
    [width, height] = $('resolution').value.split('x').map(Number);
    fit();
    measure();
  });
  $('favorite').addEventListener('click', () => {
    const pos = reviews.favorites.indexOf(current.id);
    if (pos >= 0) reviews.favorites.splice(pos, 1);
    else reviews.favorites.push(current.id);
    save();
    shortlist();
  });
  $('review-note').addEventListener('input', () => {
    reviews.notes[current.id] = $('review-note').value;
    save();
  });
  $('copy-notes').addEventListener('click', async () => {
    const ids = concepts.filter((c) => reviews.favorites.includes(c.id) || reviews.notes[c.id]);
    const text = ids.length
      ? 'Übersicht 桌面设计评审\n' +
        ids
          .map(
            (c) =>
              `${reviews.favorites.includes(c.id) ? '★' : '·'} ${c.n} ${c.name} / ${c.zh}\n${reviews.notes[c.id] || '暂无备注'}`,
          )
          .join('\n\n')
      : 'Übersicht 桌面设计评审：尚未收藏或备注。';
    try {
      await navigator.clipboard.writeText(text);
      toast('评审结果已复制');
    } catch {
      const note = $('review-note');
      note.value = text;
      note.focus();
      note.select();
      toast('请手动复制选中的评审结果');
    }
  });
  $('preview').addEventListener('load', measure);
  new ResizeObserver(fit).observe($('stage-viewport'));
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  if (!storageAvailable) $('saved-status').textContent = '仅在本页保留，请复制评审结果';
  select(current.id);
})();
