// Globe intro: the Earth scene a visitor lands on first, then hands over to
// the hero. The <head> of index.html decides whether it plays (first visit in
// this tab, no #section in the URL, motion allowed) by setting .sj-globe-on
// and data-await-arrival on <html>; it also arms a failsafe that drops the
// overlay if this module never starts. Leaving the intro (Dive in, Skip or
// Esc) fires 'sjb:arrive', which js/main.js turns into the hero entrance.
//
// Dive in is one continuous move: the camera falls toward the two host
// campuses on the south-west coast of India, and halfway down the overlay
// dissolves so the hero's campus circle opens out of the same spot.

const root = document.documentElement;
const overlay = document.getElementById('sj-globe');
const SEEN_KEY = 'sjb-globe-seen';

// The Earth rests facing South Korea (Seoul), then Dive in carries the view
// to a spot between Mangaluru (12.9N, 74.9E) and Peermade (9.6N, 77.0E)
const START = { lat: 37.5, lng: 127.0 };
const HOST = { lat: 11.2, lng: 76.0 };
const RADIUS = 100;
const CAMERA_Z = { rest: 303, hover: 290, dive: RADIUS + 6 };
const DIVE_MS = 1300;
const HANDOVER_MS = 650; // into the dive: the overlay starts to dissolve
const FADE_MS = 700; // keep in step with #sj-globe's opacity transition

const TEX = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.6/example/img/';
const CLOUDS = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/planets/earth_clouds_1024.png';

let finished = false;
let stopLoop = () => {};

function finish() {
  if (finished) { return; }
  finished = true;
  window.clearTimeout(window.sjGlobeFailsafe);
  try { window.sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {
    // Storage blocked (private mode): the intro just plays again next visit
  }
  overlay.classList.add('is-leaving');
  document.dispatchEvent(new Event('sjb:arrive'));
  window.setTimeout(() => {
    root.classList.remove('sj-globe-on');
    stopLoop();
    overlay.remove();
  }, FADE_MS + 50);
}

const rad = (deg) => (deg * Math.PI) / 180;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function start() {
  // Same URL as js/paper/paperScene.js, so the page shares one three.js
  const THREE = await import('../lib/three/three.module.min.js');

  const viz = overlay.querySelector('.globe-viz');
  const loader = overlay.querySelector('.globe-loader');
  const ui = overlay.querySelector('.globe-ui');
  const brand = ui.querySelector('.globe-brand');
  const hero = overlay.querySelector('.globe-hero');
  const footer = overlay.querySelector('.globe-footer');
  const diveBtn = document.getElementById('sj-globe-dive');

  // The day map is the Earth; without it there is no intro. Bump and clouds
  // are extras that fill in when they arrive.
  const textures = new THREE.TextureLoader();
  const map = await textures.loadAsync(TEX + 'earth-blue-marble.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  window.clearTimeout(window.sjGlobeFailsafe);
  // Too late: the head failsafe already dropped the overlay and showed the hero
  if (finished || !root.classList.contains('sj-globe-on')) { return; }

  // tilt (x) then spin (y) put a place face-on to the camera; the sphere's
  // texture seam puts longitude L at a y rotation of -90 - L. The idle drift
  // adds to the spin, so the view creeps slowly east of South Korea.
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  tilt.add(spin);
  const aim = (place) => ({ tilt: rad(place.lat), spin: rad(-90 - place.lng) });
  const FROM = aim(START);
  const TO = aim(HOST);
  tilt.rotation.x = FROM.tilt;
  let drift = 0;

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 96, 96),
    new THREE.MeshPhongMaterial({
      map,
      bumpMap: textures.load(TEX + 'earth-topology.png'),
      bumpScale: 4,
      shininess: 6,
    })
  );
  spin.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.005, 72, 72),
    new THREE.MeshPhongMaterial({
      map: textures.load(CLOUDS),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    })
  );
  spin.add(clouds);

  // Atmosphere: a slightly larger back-facing shell, brightest where it
  // meets the planet's edge and fading to nothing at its own rim.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.16, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: { glow: { value: new THREE.Color('#38a3e0') } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 glow;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = smoothstep(0.0, 0.5, -dot(vNormal, vView));
          gl_FragColor = vec4(glow, 1.0) * pow(rim, 2.2) * 0.9;
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
  );

  const scene = new THREE.Scene();
  scene.add(tilt, atmosphere);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9 * Math.PI));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7 * Math.PI);
  sun.position.set(-1, 0.6, 1);
  scene.add(sun);

  // Throws without WebGL; start() rejects and the intro is skipped
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  viz.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = CAMERA_Z.rest;

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  let targetZ = CAMERA_Z.rest;
  let dive = null; // { at, fromZ, fromTilt, fromSpin } once Dive in is pressed

  diveBtn.addEventListener('mouseenter', () => { targetZ = CAMERA_Z.hover; });
  diveBtn.addEventListener('mouseleave', () => { targetZ = CAMERA_Z.rest; });
  diveBtn.addEventListener('click', () => {
    if (dive || finished) { return; }
    dive = { at: performance.now(), fromZ: camera.position.z, fromTilt: tilt.rotation.x, fromSpin: spin.rotation.y };
    hero.classList.add('fade-out-hero');
    footer.classList.add('fade-out-footer');
    window.setTimeout(finish, HANDOVER_MS);
  });

  let frame = 0;
  (function animate(now) {
    if (dive) {
      // Fall toward HOST while the view swings across from South Korea
      const k = easeInOutCubic(Math.min(1, (now - dive.at) / DIVE_MS));
      camera.position.z = dive.fromZ + (CAMERA_Z.dive - dive.fromZ) * k;
      tilt.rotation.x = dive.fromTilt + (TO.tilt - dive.fromTilt) * k;
      spin.rotation.y = dive.fromSpin + (TO.spin - dive.fromSpin) * k;
    } else {
      camera.position.z += (targetZ - camera.position.z) * 0.04;
      drift -= 0.00012;
      spin.rotation.y = FROM.spin + drift;
    }
    clouds.rotation.y += 0.00008;

    renderer.render(scene, camera);
    frame = window.requestAnimationFrame(animate);
  })(performance.now());

  stopLoop = () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };

  // Earth loading transition: the cover lifts while the globe rises out of the
  // dark (fade + scale, see css/globe-intro.css), then the header and headline
  // follow a beat later so the planet lands first.
  function reveal() {
    loader.classList.add('fade-out');
    viz.classList.add('visible');
    window.setTimeout(() => {
      brand.classList.add('visible');
      ui.classList.add('visible');
      hero.classList.add('show-content');
    }, 450);
  }
  if (document.readyState === 'complete') { reveal(); } else { window.addEventListener('load', reveal, { once: true }); }
}

if (overlay && root.classList.contains('sj-globe-on')) {
  // Skip works even while the globe is still downloading
  document.getElementById('sj-globe-skip').addEventListener('click', finish);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { finish(); } });
  start().catch((err) => {
    console.error('Globe intro could not start; showing the site instead.', err);
    finish();
  });
}
