(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const cfg = window.WEDDING_CONFIG || {};
  const $ = id => document.getElementById(id);
  const setText = (id, text) => { if ($(id)) $(id).textContent = String(text ?? ''); };
  const first = cfg.pareja?.nombre1 || 'Fátima';
  const second = cfg.pareja?.nombre2 || 'Humberto';
  const fullFirst = cfg.pareja?.nombreCompleto1 || first;
  const fullSecond = cfg.pareja?.nombreCompleto2 || second;
  const date = new Date(cfg.fechaISO || '2026-11-28T18:30:00-05:00');
  let notificationTimer;
  const paletteLabels = {noche:'Azul noche y champagne',pizarra:'Azul pizarra y arena',royal:'Azul royal y marfil',tinta:'Azul tinta y rosa empolvado'};
  const paletteColors = {noche:'#152a46',pizarra:'#3e5c75',royal:'#263f70',tinta:'#30334e'};
  const requestedPalette = new URLSearchParams(location.search).get('tema');
  function setPalette(palette) {
    if (!Object.prototype.hasOwnProperty.call(paletteLabels,palette)) return;
    document.documentElement.dataset.theme = palette;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',paletteColors[palette]);
    document.querySelectorAll('.palette-choice').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.palette===palette)));
  }
  setPalette(requestedPalette || document.documentElement.dataset.theme || 'noche');
  document.querySelectorAll('.palette-choice').forEach(button => button.addEventListener('click', () => {
    setPalette(button.dataset.palette);
    document.querySelector('#palettePicker')?.removeAttribute('open');
  }));

  setText('firstName', first);
  setText('secondName', second);
  setText('fullName1', fullFirst);
  setText('fullName2', fullSecond);
  setText('storyMessage', cfg.pareja?.mensaje);
  setText('ceremonyTime', cfg.ceremonia?.hora);
  setText('ceremonyPlace', cfg.ceremonia?.lugar);
  setText('ceremonyDetail', cfg.ceremonia?.detalle);
  setText('ceremonyAddress', cfg.ceremonia?.direccion);
  setText('closingMessage', cfg.mensajeFinal);
  if (cfg.ceremonia?.mapa) {
    try {
      const url = new URL(cfg.ceremonia.mapa);
      if (/^https?:$/.test(url.protocol)) $('mapButton').href = url.href;
    } catch { /* Mantener la ubicación por defecto */ }
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => el.classList.remove('is-visible'), 4000);
  }

  // Música iniciada únicamente durante la interacción explícita de apertura.
  const audio = $('backgroundAudio');
  const player = $('musicPlayer');
  const musicButton = $('musicButton');
  audio.src = cfg.musica || 'assets/hasta-mi-final-il-divo.mp3';
  audio.volume = 0.65;
  function updateAudioButton() {
    const playing = !audio.paused;
    setText('musicSymbol', playing ? 'Ⅱ' : '▶');
    musicButton.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    musicButton.title = playing ? 'Pausar música' : 'Reproducir música';
  }
  audio.addEventListener('play', updateAudioButton);
  audio.addEventListener('pause', updateAudioButton);
  audio.addEventListener('error', () => {
    updateAudioButton();
    toast('No pudimos cargar la música. Comprueba que el archivo MP3 esté publicado.');
  });
  musicButton.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => toast('Tu navegador no permitió reproducir el audio.'));
    else audio.pause();
  });

  // Una sola secuencia de apertura: sello → solapa → carta → página.
  // No hay bucles continuos, destellos repetitivos ni oscilaciones rápidas.
  let opened = false;
  $('openButton').addEventListener('click', () => {
    if (opened) return;
    opened = true;
    player.hidden = false;
    audio.play().catch(() => { updateAudioButton(); toast('Puedes activar la música con el botón inferior.'); });
    const opening = $('opening');
    opening.classList.add('stage-one');
    $('openButton').disabled = true;
    window.setTimeout(() => opening.classList.add('stage-two'), 330);
    window.setTimeout(() => opening.classList.add('stage-three'), 1280);
    window.setTimeout(() => opening.classList.add('stage-four'), 2700);
    window.setTimeout(() => {
      document.body.classList.remove('locked');
      opening.classList.add('is-dismissing');
      document.body.classList.add('entered');
      $('siteHeader').querySelector('.logo')?.focus({preventScroll:true});
    }, 3250);
    window.setTimeout(() => {
      opening.setAttribute('aria-hidden', 'true');
      opening.hidden = true;
    }, 4550);
  });

  // Cuenta regresiva en hora de Piura (UTC-5).
  function countdown() {
    const distance = Math.max(0, date.getTime() - Date.now());
    const format = (value, width=2) => String(value).padStart(width, '0');
    setText('days', format(Math.floor(distance / 86400000), 3));
    setText('hours', format(Math.floor(distance % 86400000 / 3600000)));
    setText('minutes', format(Math.floor(distance % 3600000 / 60000)));
    setText('seconds', format(Math.floor(distance % 60000 / 1000)));
  }
  countdown();
  window.setInterval(countdown, 1000);

  // Evento de calendario, 1 hora de duración referencial.
  const icsEscape = value => String(value || '').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const icsTime = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/,'');
  $('calendarButton').addEventListener('click', () => {
    const where = [cfg.ceremonia?.lugar, cfg.ceremonia?.direccion].filter(Boolean).join(', ');
    const description = 'Ceremonia religiosa, 6:30 p. m. ' + (cfg.ceremonia?.mapa || '') + '. Duración del recordatorio: 1 hora referencial.';
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Boda Fatima Humberto//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',
      'UID:boda-fh-20261128@invitacion.local', `DTSTAMP:${icsTime(new Date())}`, `DTSTART:${icsTime(date)}`, 'DURATION:PT1H',
      `SUMMARY:${icsEscape('Matrimonio de '+first+' y '+second)}`, `LOCATION:${icsEscape(where)}`,
      `DESCRIPTION:${icsEscape(description)}`, 'END:VEVENT', 'END:VCALENDAR'];
    const blob = new Blob([lines.join('\r\n')], {type:'text/calendar;charset=utf-8'});
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');link.href = objectUrl;link.download = 'boda-fatima-humberto.ics';
    document.body.append(link);link.click();link.remove();setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    toast('Fecha añadida al archivo de calendario: 28 de noviembre, 6:30 p. m.');
  });

  $('shareButton').addEventListener('click', async () => {
    const data = {title:`Boda de ${first} y ${second}`,text:'Nos casamos el 28 de noviembre de 2026, a las 6:30 p. m.',url:location.href};
    try {
      if (navigator.share) {await navigator.share(data);return;}
      if (navigator.clipboard?.writeText) {await navigator.clipboard.writeText(data.url);toast('Enlace copiado.');return;}
      window.prompt('Copia el enlace de la invitación:',data.url);
    } catch(error) {if(error.name!=='AbortError')toast('No se pudo compartir el enlace.');}
  });

  // Animaciones de secciones: activación una sola vez a medida que se avanza.
  const elements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(items => {
      for (const item of items) if(item.isIntersecting) {
        item.target.classList.add('is-visible');observer.unobserve(item.target);
      }
    }, {rootMargin:'0px 0px -55px 0px',threshold:.08});
    elements.forEach(el => observer.observe(el));
  } else elements.forEach(el => el.classList.add('is-visible'));

  let scheduled = false;
  window.addEventListener('scroll', () => {
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(() => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      $('pageProgress').style.width = (available > 0 ? Math.min(100,Math.max(0,window.scrollY / available * 100)) : 0) + '%';
      scheduled = false;
    });
  }, {passive:true});
})();
