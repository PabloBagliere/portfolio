const canvas = document.querySelector('#movie');
const ctx = canvas.getContext('2d');
const intro = document.querySelector('#intro');
const caption = document.querySelector('#caption');
const seek = document.querySelector('#seek');
const toggle = document.querySelector('#toggle');
const restart = document.querySelector('#restart');
const previous = document.querySelector('#previous');
const narration = document.querySelector('#narration');
const timeLabel = document.querySelector('#time');

let started = false;
let paused = false;
let startAt = 0;
let pausedAt = 0;
let lastCaption = '';
let narrationOn = false;
let size = { w: 1280, h: 720, scale: 1 };

const narrationLines = [
  'Edelina vive con Alma y Celeste en un campo de la Patagonia. Un día, su madre las abandona y se pierde por el camino entre las montañas.',
  'Edelina le cuenta la noticia a su familia. Como su padre trabaja todo el día, deja la escuela para hacerse cargo de sus hermanas.',
  'Edelina tiene dos amigos: Lisandro, hijo del capataz del campo vecino, e Indira, hija del intendente del pueblo.',
  'El intendente denuncia que la madre abandonó a las niñas. Por esa denuncia llegan María Eugenia e Isabel, funcionarias de Juntos por la Vida, para buscar a Edelina y sus hermanas.',
  'Antes de ir al campo, las funcionarias preguntan en la escuela. La maestra Amelia les cuenta que Indira y su madre sufren maltrato del intendente, pero ellas exigen una denuncia para actuar.',
  'En una fiesta, el padre de Edelina presenta a Orfelia como su nueva pareja. Haydée intenta hablar con él. Las funcionarias querían ir, pero se pierden y terminan en la casa de Aureliana.',
  'Indira ya no soporta la violencia. Escapa a la casa de Edelina buscando un lugar seguro. Su madre también huye para encontrarla.',
  'La madre de Indira busca a Lisandro. Él sabe que Indira está con Edelina y corre a avisar: el intendente puede ir armado.',
  'Amelia llama a las funcionarias. Ellas reciben una orden de su superior: no meterse con el intendente. Por eso deciden renunciar.',
  'Al descubrir que su esposa e hija no están, el intendente toma una escopeta y sale furioso hacia la casa de Edelina.',
  'Aureliana descubre lo que ocurre y pone sus vacas en el camino. El intendente no puede pasar: apunta y dispara contra los animales.',
  'Los disparos alertan al pueblo. La gente llega a ayudar a Aureliana y el intendente termina detenido.',
  'Indira y su madre se van a la ciudad con las funcionarias. Orfelia cuidará a Alma y Celeste, y Edelina podrá volver a la escuela.'
];

// Da a cada escena solo el tiempo necesario para que termine su narración.
let totalSeconds = 0;
const captions = narrationLines.map((text) => {
  const seconds = Math.max(7, Math.ceil(text.split(/\s+/).length / 2.7 + 1));
  const scene = [totalSeconds, totalSeconds + seconds, text];
  totalSeconds += seconds;
  return scene;
});
const duration = totalSeconds;

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const ratio = Math.min(rect.width / 1280, rect.height / 720);
  size = { w: rect.width, h: rect.height, scale: ratio };
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}

function line(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

function backdrop(t, mode = 0) {
  const danger = mode === 5;
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, danger ? '#56323a' : '#27606a'); sky.addColorStop(1, danger ? '#d1744e' : '#e6a967');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 720);
  circle(mode === 3 ? 180 : 940, 118, 63, danger ? '#ef9770' : '#ffe2a3');
  ctx.fillStyle = '#315951'; mountain(0, 490, 300, 210); mountain(220, 490, 410, 300); mountain(570, 490, 360, 240); mountain(860, 490, 430, 290);
  ctx.fillStyle = '#193e3b'; ctx.fillRect(0, 485, 1280, 235);
  ctx.fillStyle = mode === 3 ? '#6b8a6a' : '#b86c41'; ctx.beginPath(); ctx.moveTo(0, 625); ctx.quadraticCurveTo(360, 560, 690, 630); ctx.quadraticCurveTo(950, 690, 1280, 585); ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.fill();
  for (let x = 30; x < 1280; x += 58) line(x, 645 + Math.sin(x) * 10, x + 12, 615 + Math.cos(x) * 11, 2, '#de9658');
}

function mountain(x, y, w, h) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * .48, y - h); ctx.lineTo(x + w, y); ctx.fill(); }

function person(x, y, t, { shirt = '#e9bf75', hair = '#3b2724', scale = 1, walk = false, sad = false } = {}) {
  const step = walk ? Math.sin(t * 9 + x) * 13 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  line(-12, 68, -12 + step, 108, 9, '#263636'); line(12, 68, 12 - step, 108, 9, '#263636');
  line(-8, 105, -24 + step, 105, 7, '#202c30'); line(8, 105, 26 - step, 105, 7, '#202c30');
  ctx.fillStyle = shirt; ctx.fillRect(-28, 8, 56, 65);
  line(-23, 23, -46 - step * .5, 51, 8, '#e3a76e'); line(23, 23, 46 + step * .5, 51, 8, '#e3a76e');
  circle(0, -18, 31, '#e3a76e'); circle(0, -28, 33, hair);
  circle(0, -16, 28, '#e3a76e');
  if (sad) line(-8, -5, 8, -5, 2, '#704440'); else line(-7, -8, 7, -8, 2, '#704440');
  circle(-10, -23, 2.5, '#263636'); circle(10, -23, 2.5, '#263636');
  ctx.restore();
}

function house(x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#e9bf75'; ctx.fillRect(0, 0, 190, 125); ctx.fillStyle = '#a7503e'; ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(95, -90); ctx.lineTo(215, 0); ctx.fill(); ctx.fillStyle = '#25464a'; ctx.fillRect(76, 68, 34, 57); ctx.restore();
}

function road() {
  ctx.fillStyle = '#d9b47b'; ctx.beginPath(); ctx.moveTo(570, 720); ctx.lineTo(750, 720); ctx.lineTo(695, 492); ctx.lineTo(665, 492); ctx.fill();
}

function school(x, y) {
  ctx.fillStyle = '#f4e5c1'; ctx.fillRect(x, y, 240, 145); ctx.fillStyle = '#bb5943'; ctx.beginPath(); ctx.moveTo(x - 28, y); ctx.lineTo(x + 120, y - 92); ctx.lineTo(x + 268, y); ctx.fill(); ctx.fillStyle = '#2b5253'; ctx.fillRect(x + 100, y + 80, 40, 65); ctx.fillStyle = '#f4e5c1'; ctx.font = '16px DM Mono'; ctx.fillText('ESCUELA', x + 75, y + 40);
}

function town() { house(180, 425, .62); house(420, 400, .78); house(820, 430, .65); ctx.fillStyle = '#f1dfa9'; ctx.fillRect(655, 350, 150, 165); ctx.fillStyle = '#9f4d3b'; ctx.fillRect(635, 320, 190, 35); ctx.fillStyle = '#f1dfa9'; ctx.font = '16px DM Mono'; ctx.fillText('MUNICIPIO', 658, 393); }

function tag(text, x, y) { ctx.fillStyle = '#fff5e2'; ctx.font = '12px DM Mono'; const w = ctx.measureText(text).width + 16; ctx.fillRect(x - w / 2, y - 20, w, 20); ctx.fillStyle = '#263636'; ctx.fillText(text, x - w / 2 + 8, y - 6); }

function shotgun(x, y, firing = false, direction = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(direction, 1); ctx.rotate(-.18);
  ctx.fillStyle = '#75472e'; ctx.beginPath(); ctx.roundRect(-34, -9, 54, 18, 6); ctx.fill();
  ctx.fillStyle = '#3e4950'; ctx.fillRect(14, -6, 115, 12); ctx.fillStyle = '#252b2e'; ctx.fillRect(18, 7, 16, 22);
  if (firing) { ctx.fillStyle = '#ffe49a'; ctx.beginPath(); ctx.moveTo(129, 0); ctx.lineTo(158, -17); ctx.lineTo(149, 0); ctx.lineTo(158, 17); ctx.fill(); }
  ctx.restore();
}

function cow(x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 5 + x) * 2); ctx.scale(s, s); ctx.fillStyle = '#f2e7cb'; ctx.beginPath(); ctx.ellipse(0, 0, 44, 26, 0, 0, Math.PI * 2); ctx.fill(); circle(40, -10, 17, '#f2e7cb'); line(-20, 20, -20, 46, 5, '#342c29'); line(18, 20, 18, 46, 5, '#342c29'); ctx.fillStyle = '#493b36'; circle(-10, -5, 9, '#493b36'); circle(10, 9, 8, '#493b36'); ctx.restore();
}

function scene(t) {
  const s = Math.max(0, captions.findIndex(([, to]) => t < to));
  const local = t - captions[s][0];
  backdrop(t, s);
  if (s === 0) { road(); house(165, 420, .85); person(270, 500, t, { shirt: '#c04d47', sad: true }); tag('EDELINA', 270, 430); person(355, 525, t, { shirt: '#e9bf75', scale: .65 }); person(410, 528, t, { shirt: '#7a9c79', scale: .58 }); const x = 610 + local * 37; person(x, 455 - local * 3, t, { shirt: '#7e5a8d', hair: '#b17b4d', scale: .78, walk: true }); tag('MAMÁ', x, 365 - local * 3); }
  if (s === 1) { house(760, 420); person(420, 480, t, { shirt: '#c04d47', sad: true }); tag('EDELINA', 420, 412); person(545, 510, t, { shirt: '#e9bf75', scale: .68 }); tag('ALMA', 545, 455); person(625, 512, t, { shirt: '#7a9c79', scale: .6 }); tag('CELESTE', 625, 462); person(1000, 470, t, { shirt: '#4f718e', hair: '#312723' }); tag('PAPÁ DE EDELINA', 1000, 402); }
  if (s === 2) { school(750, 375); person(360, 485, t, { shirt: '#c04d47' }); tag('EDELINA', 360, 415); person(510, 480, t, { shirt: '#557b9c', hair: '#563a2d' }); tag('LISANDRO', 510, 410); person(625, 485, t, { shirt: '#7a9c79', hair: '#6a4434' }); tag('INDIRA', 625, 415); }
  if (s === 3) { town(); person(360, 472, t, { shirt: '#4d806f', hair: '#6a4434' }); tag('AMELIA, MAESTRA', 360, 400); person(600, 472, t, { shirt: '#e9bf75' }); tag('MARÍA EUGENIA', 600, 400); person(735, 472, t, { shirt: '#d58a62' }); tag('ISABEL', 735, 400); person(990, 470, t, { shirt: '#c04d47', sad: true }); tag('EDELINA', 990, 400); }
  if (s === 4) { town(); person(390, 482, t, { shirt: '#7a9c79', hair: '#6a4434', sad: true }); tag('INDIRA', 390, 413); person(510, 482, t, { shirt: '#ad6751', hair: '#6a4434', sad: true }); tag('MAMÁ DE INDIRA', 510, 413); person(730, 468, t, { shirt: '#55383b', hair: '#1b1b1b' }); tag('INTENDENTE', 730, 398); person(980, 470, t, { shirt: '#4d806f' }); tag('AMELIA', 980, 400); ctx.fillStyle = '#fff5e2'; ctx.fillRect(1080, 418, 115, 52); ctx.fillStyle = '#263636'; ctx.font = '13px DM Mono'; ctx.fillText('SIN DENUNCIA', 1089, 447); }
  if (s === 5 && local < 7) { house(680, 420); person(370, 480, t, { shirt: '#4f718e', hair: '#312723' }); tag('PAPÁ DE EDELINA', 370, 410); person(555, 480, t, { shirt: '#d1895b', hair: '#4b332d' }); tag('ORFELIA', 555, 410); person(770, 490, t, { shirt: '#c04d47' }); person(870, 490, t, { shirt: '#e9bf75', scale: .68 }); person(945, 492, t, { shirt: '#7a9c79', scale: .6 }); person(1050, 475, t, { shirt: '#4d806f' }); tag('DIRECTORA HAYDÉE', 1050, 405); }
  if (s === 5 && local >= 7) { house(650, 420); person(400, 480, t, { shirt: '#b26451', hair: '#dad6c7' }); tag('AURELIANA', 400, 410); person(820, 480, t, { shirt: '#e9bf75' }); tag('MARÍA EUGENIA', 820, 410); person(1010, 480, t, { shirt: '#d58a62' }); tag('ISABEL', 1010, 410); ctx.fillStyle = '#fff5e2'; ctx.font = '15px DM Mono'; ctx.fillText('SE PERDIERON BUSCANDO EL CAMPO', 430, 345); }
  if (s === 6) { house(750, 420); person(390 + local * 28, 490, t, { shirt: '#7a9c79', hair: '#6a4434', walk: true, sad: true }); tag('INDIRA', 520, 415); person(750, 490, t, { shirt: '#c04d47' }); tag('EDELINA', 750, 420); person(845, 505, t, { shirt: '#e9bf75', scale: .68 }); person(925, 507, t, { shirt: '#7a9c79', scale: .6 }); person(1100 - local * 20, 485, t, { shirt: '#ad6751', hair: '#6a4434', walk: true, sad: true }); tag('MAMÁ DE INDIRA', 1010, 410); }
  if (s === 7) { house(245, 420, .8); house(800, 420, .82); person(390, 480, t, { shirt: '#557b9c', hair: '#563a2d' }); tag('LISANDRO', 390, 410); person(565 + local * 35, 480, t, { shirt: '#ad6751', hair: '#6a4434', walk: true }); tag('MAMÁ DE INDIRA', 780, 410); person(1050, 485, t, { shirt: '#c04d47', sad: true }); tag('EDELINA', 1050, 415); }
  if (s === 8) { town(); person(390, 470, t, { shirt: '#4d806f' }); tag('AMELIA', 390, 400); person(590, 470, t, { shirt: '#e9bf75', sad: true }); tag('MARÍA EUGENIA', 590, 400); person(735, 470, t, { shirt: '#d58a62', sad: true }); tag('ISABEL', 735, 400); ctx.fillStyle = '#fff5e2'; ctx.fillRect(870, 390, 230, 90); ctx.fillStyle = '#263636'; ctx.font = '15px DM Mono'; ctx.fillText('"NO SE METAN CON', 885, 425); ctx.fillText('EL INTENDENTE"', 905, 451); }
  if (s === 9) { road(); house(770, 420); const x = 260 + local * 42; person(x, 485, t, { shirt: '#55383b', hair: '#1b1b1b', walk: true }); tag('INTENDENTE', x, 415); shotgun(x + 32, 518); person(900, 490, t, { shirt: '#c04d47', sad: true }); person(990, 490, t, { shirt: '#7a9c79', hair: '#6a4434', sad: true }); }
  if (s === 10) { road(); cow(350, 565, t); cow(495, 580, t, .85); cow(640, 557, t, 1.1); person(830, 478, t, { shirt: '#b26451', hair: '#dad6c7' }); tag('AURELIANA', 830, 408); person(1050, 490, t, { shirt: '#55383b', hair: '#1b1b1b' }); tag('INTENDENTE', 1050, 420); const firing = local > 6 && local < 8; shotgun(1055, 518, firing, -1); if (local > 6) { ctx.fillStyle = '#a9493c'; ctx.beginPath(); ctx.ellipse(350, 610, 70, 16, .4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff5e2'; ctx.font = '16px DM Mono'; ctx.fillText('¡DISPARO!', 550, 365); } }
  if (s === 11) { road(); cow(430, 570, t, .8); person(330, 485, t, { shirt: '#c04d47' }); person(450, 485, t, { shirt: '#4d806f' }); person(570, 485, t, { shirt: '#557b9c' }); person(740, 485, t, { shirt: '#315b86', hair: '#1b1b1b' }); tag('POLICÍA', 740, 415); person(890, 490, t, { shirt: '#55383b', hair: '#1b1b1b', sad: true }); tag('INTENDENTE DETENIDO', 890, 420); }
  if (s === 12) { school(750, 375); person(360, 490, t, { shirt: '#7a9c79', hair: '#6a4434', walk: true }); tag('INDIRA', 360, 420); person(475, 485, t, { shirt: '#ad6751', hair: '#6a4434', walk: true }); tag('MAMÁ DE INDIRA', 475, 415); person(700, 490, t, { shirt: '#c04d47', walk: true }); tag('EDELINA', 700, 420); person(920, 480, t, { shirt: '#d1895b', hair: '#4b332d' }); tag('ORFELIA', 920, 410); person(1010, 510, t, { shirt: '#e9bf75', scale: .68 }); person(1080, 512, t, { shirt: '#7a9c79', scale: .6 }); }
}

function frame(now) {
  if (!started) return;
  const elapsed = paused ? pausedAt : Math.min((now - startAt) / 1000, duration);
  const dpr = devicePixelRatio; ctx.setTransform(dpr * size.scale, 0, 0, dpr * size.scale, (size.w - 1280 * size.scale) * dpr / 2, (size.h - 720 * size.scale) * dpr / 2);
  scene(elapsed);
  const currentCaption = captions.find(([from, to]) => elapsed >= from && elapsed < to)?.[2] || '';
  if (currentCaption !== lastCaption) {
    caption.textContent = currentCaption;
    caption.classList.toggle('show', Boolean(currentCaption));
    lastCaption = currentCaption;
    if (narrationOn && currentCaption) speak(currentCaption);
  }
  seek.value = elapsed;
  const elapsedMinutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const elapsedSeconds = String(Math.floor(elapsed % 60)).padStart(2, '0');
  const durationMinutes = String(Math.floor(duration / 60)).padStart(2, '0');
  const durationSeconds = String(Math.floor(duration % 60)).padStart(2, '0');
  timeLabel.textContent = `${elapsedMinutes}:${elapsedSeconds} / ${durationMinutes}:${durationSeconds}`;
  if (elapsed < duration && !paused) requestAnimationFrame(frame);
  if (elapsed >= duration) { toggle.textContent = '▶'; paused = true; pausedAt = duration; window.speechSynthesis.cancel(); }
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-AR';
  utterance.rate = 1;
  const voice = window.speechSynthesis.getVoices().find(({ lang }) => lang.startsWith('es'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function playFrom(seconds = 0) { paused = false; pausedAt = seconds; startAt = performance.now() - seconds * 1000; toggle.textContent = '||'; requestAnimationFrame(frame); }
document.querySelector('#start').addEventListener('click', () => { intro.classList.add('hidden'); started = true; playFrom(); });
toggle.addEventListener('click', () => { if (!started) return; if (paused) playFrom(pausedAt); else { pausedAt = (performance.now() - startAt) / 1000; paused = true; toggle.textContent = '▶'; window.speechSynthesis.cancel(); } });
restart.addEventListener('click', () => { if (!started) { intro.classList.add('hidden'); started = true; } playFrom(0); });
previous.addEventListener('click', () => { if (!started) return; const now = paused ? pausedAt : (performance.now() - startAt) / 1000; const current = Math.max(0, captions.findIndex(([, to]) => now < to)); playFrom(captions[Math.max(0, current - 1)][0]); });
seek.addEventListener('input', () => { if (!started) return; const target = Number(seek.value); pausedAt = target; startAt = performance.now() - target * 1000; lastCaption = ''; if (paused) { ctx.setTransform(1, 0, 0, 1, 0, 0); frame(performance.now()); } });
narration.addEventListener('click', () => { narrationOn = !narrationOn; narration.textContent = narrationOn ? '♬ Voz: sí' : '♬ Voz: no'; if (!narrationOn) window.speechSynthesis.cancel(); else if (lastCaption) speak(lastCaption); });
seek.max = duration;
window.addEventListener('resize', resize); resize();
