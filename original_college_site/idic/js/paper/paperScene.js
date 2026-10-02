/*
 * Paper WebGL scene: renderer, subdivided sheet, shadow. No scroll logic here;
 * the caller hands in a pose each frame via render(pose).
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, PlaneGeometry,
  ShaderMaterial, DoubleSide, Vector2, Vector3, CanvasTexture,
} from '../../lib/three/three.module.min.js';
import {
  paperVertex, paperFragment, shadowVertex, shadowFragment,
} from './paperDeformation.js';
import { drawPaperMark } from './paperMark.js';

export const PAPER_ASPECT = 4 / 6;   // 4 cm x 6 cm, width / height
const HALF = new Vector2(PAPER_ASPECT / 2, 0.5);
const BALL_RADIUS = 0.27;           // in paper heights
const FOV = 30;

/** quality: { segX, segY, maxDpr } */
export function createPaperScene(canvas, quality) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 10, 10000);

  const markCanvas = document.createElement('canvas');
  drawPaperMark(markCanvas);
  const markTex = new CanvasTexture(markCanvas);
  markTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const paperGeo = new PlaneGeometry(PAPER_ASPECT, 1, quality.segX, quality.segY);
  const paperMat = new ShaderMaterial({
    vertexShader: paperVertex,
    fragmentShader: paperFragment,
    side: DoubleSide,
    extensions: { derivatives: true },
    uniforms: {
      uMap: { value: markTex },
      uWrap: { value: 0 },
      uSeed: { value: 3.7 },
      uHalf: { value: HALF },
      uRadius: { value: BALL_RADIUS },
      uLight: { value: new Vector3(-0.40, 0.55, 0.73).normalize() },
    },
  });
  const paper = new Mesh(paperGeo, paperMat);
  paper.frustumCulled = false;

  const shadowGeo = new PlaneGeometry(1, 1);
  const shadowMat = new ShaderMaterial({
    vertexShader: shadowVertex,
    fragmentShader: shadowFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uBall: { value: 0 },
      uOpacity: { value: 0.3 },
      uBlur: { value: 0.05 },
      uHalf: { value: HALF },
      uRadius: { value: BALL_RADIUS },
    },
  });
  const shadow = new Mesh(shadowGeo, shadowMat);
  shadow.renderOrder = -1;
  shadow.frustumCulled = false;

  scene.add(shadow, paper);

  let width = 1, height = 1;

  function setSize(w, h) {
    width = w; height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // z = 0 plane maps 1:1 to CSS pixels
    camera.position.set(0, 0, (h / 2) / Math.tan((FOV * Math.PI) / 360));
    camera.updateProjectionMatrix();
  }

  /**
   * pose: { x, y (viewport px, centre), size (px, paper height), wrap 0..1,
   *         rx, ry, rz (rad), shadow (0..1) }
   */
  function render(pose) {
    const px = pose.x - width / 2;
    const py = -(pose.y - height / 2);
    paper.position.set(px, py, 0);
    paper.scale.setScalar(pose.size);
    paper.rotation.set(pose.rx, pose.ry, pose.rz);
    paperMat.uniforms.uWrap.value = pose.wrap;

    const ball = pose.wrap * pose.wrap * (3 - 2 * pose.wrap);
    shadow.position.set(px + pose.size * (0.05 + 0.04 * ball), py - pose.size * (0.06 + 0.12 * ball), -pose.size * 0.5);
    shadow.scale.setScalar(pose.size * 2.4);
    shadowMat.uniforms.uBall.value = ball;
    shadowMat.uniforms.uBlur.value = 0.05 + 0.10 * ball;
    shadowMat.uniforms.uOpacity.value = pose.shadow * (0.30 + 0.10 * ball);

    renderer.render(scene, camera);
  }

  /** redraw the printed mark (after web fonts arrive) */
  function refreshMark() {
    drawPaperMark(markCanvas);
    markTex.needsUpdate = true;
  }

  function dispose() {
    markTex.dispose();
    paperGeo.dispose(); paperMat.dispose();
    shadowGeo.dispose(); shadowMat.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return { setSize, render, refreshMark, dispose };
}
