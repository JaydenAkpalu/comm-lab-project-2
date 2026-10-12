/* Story choices enhance the existing comic; without JavaScript all panels remain readable. */
(() => {
  const panels = [...document.querySelectorAll('.panel')];
  const toolbar = document.querySelector('.story-toolbar');
  const progress = document.getElementById('storyProgress');
  const showAll = document.getElementById('showAll');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stage = 0;
  const chapters = [
    { end: 3, text: 'Chapter 1 of 4 · The invitation' },
    { end: 10, text: 'Chapter 2 of 4 · Finding your place' },
    { end: 14, text: 'Chapter 3 of 4 · Together' },
    { end: 16, text: 'Chapter 4 of 4 · What stays with you' }
  ];

  panels.forEach((panel, i) => {
    panel.id = `story-panel-${i + 1}`;
    panel.tabIndex = -1;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `Panel ${i + 1} of ${panels.length}`);
  });

  function refreshLayout() {
    requestAnimationFrame(() => window.ScrollTrigger?.refresh());
  }

  function render() {
    panels.forEach((panel, i) => { panel.hidden = i >= chapters[stage].end; });
    progress.textContent = chapters[stage].text;
    refreshLayout();
  }

  function advance(button, expectedStage) {
    if (stage !== expectedStage) return;
    const nextPanel = panels[chapters[stage].end];
    const choice = button.closest('.story-choice');
    choice.querySelectorAll('button').forEach(control => { control.disabled = true; });
    choice.hidden = true;
    stage += 1;
    render();
    nextPanel.focus({ preventScroll: true });
    nextPanel.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
  }

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'enter') advance(button, 0);
      if (action === 'help') advance(button, 1);
      if (action === 'close') advance(button, 2);
      if (action === 'alone' || action === 'linger') {
        document.querySelector(`[data-response="${action}"]`).hidden = false;
        button.setAttribute('aria-expanded', 'true');
        button.disabled = true;
        refreshLayout();
      }
    });
  });

  showAll.addEventListener('click', () => {
    panels.forEach(panel => { panel.hidden = false; });
    document.querySelectorAll('.story-choice').forEach(choice => { choice.hidden = true; });
    progress.textContent = 'All 16 panels · Read at your own pace';
    showAll.disabled = true;
    refreshLayout();
  });
  document.getElementById('restartStory').addEventListener('click', () => window.location.reload());
  document.querySelectorAll('.story-choice').forEach(choice => { choice.hidden = false; });
  toolbar.hidden = false;
  render();
})();
