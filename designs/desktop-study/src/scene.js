(() => {
  const params = new URLSearchParams(location.search);
  const concept =
    window.CONCEPTS.find((c) => c.id === document.body.dataset.concept) || window.CONCEPTS[2];
  const desktop = document.getElementById('desktop');
  const validWallpapers = ['dusk', 'sand', 'cobalt'];
  const wallpaper = params.get('wallpaper') || 'dusk';
  desktop.dataset.wallpaper = validWallpapers.includes(wallpaper) ? wallpaper : 'dusk';
  desktop.dataset.window = params.get('window') === 'on' ? 'on' : 'off';
  desktop.dataset.icons = params.get('icons') === 'off' ? 'off' : 'on';
  document.title = concept.n + ' / ' + concept.name + ' · Desktop study';
  document.getElementById('widgets').innerHTML = concept.content;
})();
