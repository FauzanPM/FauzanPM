import { axisRotation, multiply, rotationMatrix, transform } from './scene-math';
import type { Vector3 } from './scene-math';

export type SceneOptions = {
  mode: number;
  reducedMotion: boolean;
  paused: boolean;
  engaged: boolean;
};
export type OrbitalNode = { element: HTMLElement; position: Vector3; layer: number };
export type NetworkScene = {
  update: (next: SceneOptions) => void;
  reset: () => void;
  dispose: () => void;
};
const TAU = Math.PI * 2;
const initialOrientation = () => multiply(axisRotation('x', -0.19), axisRotation('y', 0.25));

/** A single owner for canvas, pointer capture, DOM projections, and animation resources. */
export function createNetworkScene(
  canvas: HTMLCanvasElement,
  surface: HTMLElement,
  nodes: OrbitalNode[],
  initialOptions: SceneOptions,
): NetworkScene {
  const context = canvas.getContext('2d');
  if (!context) return { update() {}, reset() {}, dispose() {} };
  const ctx = context;
  const satellites = nodes.map((node) => ({
    ...node,
    button: node.element.querySelector<HTMLButtonElement>('button')!,
    width: 0,
    height: 0,
  }));
  let options = initialOptions;
  let width = 0,
    height = 0,
    frame = 0,
    lastTime = 0;
  let visible = true,
    disposed = false,
    hoverHeld = false,
    blockClick = false;
  let orientation = initialOrientation();
  const velocity = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let drag: {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    moved: boolean;
    touch: boolean;
  } | null = null;
  let color = '184,247,179',
    lineAlpha = 0.26,
    light = false;
  const points: Vector3[] = Array.from({ length: 1300 }, (_, index) => {
    const y = 1 - (index / 1299) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
  });
  function readPalette() {
    const style = getComputedStyle(document.documentElement);
    light = document.documentElement.dataset.theme === 'light';
    color =
      options.mode === 0
        ? style.getPropertyValue('--network-rgb').trim() || (light ? '39,107,73' : '184,247,179')
        : (light
            ? ['39,107,73', '104,80,149', '27,107,130']
            : ['184,247,179', '189,181,251', '129,213,230'])[options.mode];
    lineAlpha =
      Number.parseFloat(style.getPropertyValue('--network-line-alpha')) || (light ? 0.4 : 0.26);
    schedule();
  }
  function project(point: Vector3, radius: number, matrix: number[]) {
    const p = transform(point, matrix);
    const perspective = 3.8 / (3.8 - p.z * 0.32);
    return {
      x: width / 2 + p.x * radius * perspective,
      y: height / 2 + p.y * radius * perspective,
      z: p.z,
    };
  }
  function draw(time: number) {
    frame = 0;
    if (disposed || !width || !height) return;
    const dt = lastTime ? Math.min(time - lastTime, 40) : 16;
    lastTime = time;
    const focused = document.activeElement;
    const keyboardHeld =
      !!focused && surface.contains(focused) && focused.matches(':focus-visible');
    const themeChanging = document.documentElement.hasAttribute('data-theme-transition');
    const held = options.engaged || hoverHeld || keyboardHeld || themeChanging;
    const animate =
      !options.paused && !options.reducedMotion && !held && !drag && visible && !document.hidden;
    if (animate) {
      orientation = multiply(axisRotation('y', dt * 0.000095 + velocity.x), orientation);
      orientation = multiply(axisRotation('x', velocity.y), orientation);
      const friction = Math.pow(0.91, dt / 16.67);
      velocity.x *= friction;
      velocity.y *= friction;
    }
    if (!held && !options.reducedMotion && !options.paused && !drag) {
      parallax.x += (parallax.targetX - parallax.x) * 0.09;
      parallax.y += (parallax.targetY - parallax.y) * 0.09;
    }
    const camera = multiply(
      axisRotation('x', parallax.y),
      multiply(axisRotation('y', parallax.x), orientation),
    );
    const matrix = rotationMatrix(camera);
    const radius = Math.min(width * 0.285, height * 0.315);
    // The perspective silhouette is slightly wider than the sphere's equator.
    const silhouette = radius / Math.sqrt(1 - (0.32 / 3.8) ** 2);
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.3,
      width / 2,
      height / 2,
      radius * 1.65,
    );
    glow.addColorStop(0, `rgba(${color},${light ? 0.035 : 0.07})`);
    glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    for (let orbit = 0; orbit < 3; orbit++) {
      ctx.beginPath();
      for (let step = 0; step <= 120; step++) {
        const t = (step / 120) * TAU;
        const p = project(
          { x: Math.cos(t) * 1.39, y: Math.sin(t) * (orbit - 1) * 0.65, z: Math.sin(t) * 1.15 },
          radius,
          matrix,
        );
        if (step === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = `rgba(${color},${orbit === options.mode ? lineAlpha : lineAlpha * 0.32})`;
      ctx.stroke();
    }
    for (let line = 0; line < 10; line++) {
      const longitude = (line / 10) * Math.PI;
      ctx.beginPath();
      for (let step = 0; step <= 70; step++) {
        const t = (step / 70) * TAU;
        const p = project(
          {
            x: Math.cos(t) * Math.cos(longitude),
            y: Math.sin(t),
            z: Math.cos(t) * Math.sin(longitude),
          },
          radius,
          matrix,
        );
        if (step === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(${color},${light ? 0.12 : 0.075})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    for (let index = 0; index < points.length; index++) {
      const p = project(points[index], radius, matrix);
      const front = (p.z + 1) / 2;
      const alpha = (0.13 + front * 0.64) * (0.65 + Math.sin(index * 1.37) * 0.25);
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (0.6 + front * 0.75) * (index % 47 === 0 ? 1.7 : 1), 0, TAU);
      ctx.fill();
    }
    for (const node of satellites) {
      const p = project(node.position, radius * 1.22, matrix);
      const inside = project(node.position, radius * 0.88, matrix);
      const x = Math.max(48, Math.min(width - 48, p.x));
      const y = Math.max(35, Math.min(height - 44, p.y));
      const depth = Math.max(0, Math.min(1, (p.z + 1.2) / 2.4));
      const scale = 0.88 + depth * 0.12;
      node.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      node.element.style.zIndex = String(3 + Math.round(depth * 9));
      node.element.style.setProperty('--node-scale', String(scale));
      node.element.dataset.activeLayer = String(node.layer === options.mode);
      node.element.dataset.depth = depth > 0.5 ? 'front' : 'rear';
      const halfWidth = (node.width * scale) / 2;
      const halfHeight = (node.height * scale) / 2;
      const distanceX = Math.abs(x - width / 2);
      const distanceY = Math.abs(y - height / 2);
      const covered =
        p.z < 0 &&
        Math.hypot(Math.max(0, distanceX - halfWidth), Math.max(0, distanceY - halfHeight)) <
          silhouette;
      const hidden =
        covered && Math.hypot(distanceX + halfWidth, distanceY + halfHeight) < silhouette;
      node.element.dataset.occlusion = hidden ? 'full' : covered ? 'partial' : 'none';
      if (covered) {
        // Cut the globe's silhouette out of the rear card. Unlike a CSS mask,
        // this also excludes the covered pixels from pointer hit testing.
        const cx = node.width / 2 + (width / 2 - x) / scale;
        const cy = node.height / 2 + (height / 2 - y) / scale;
        const r = silhouette / scale;
        const f = (value: number) => value.toFixed(2);
        node.button.style.clipPath = `path(evenodd, "M -24 -24 H ${f(node.width + 24)} V ${f(node.height + 24)} H -24 Z M ${f(cx - r)} ${f(cy)} a ${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0 Z")`;
      } else {
        node.button.style.clipPath = '';
      }
      ctx.save();
      if (p.z < 0) {
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.moveTo(width / 2 + silhouette, height / 2);
        ctx.arc(width / 2, height / 2, silhouette, 0, TAU);
        ctx.clip('evenodd');
      }
      ctx.beginPath();
      ctx.moveTo(inside.x, inside.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${color},${(node.layer === options.mode ? 0.32 : 0.14) * (0.65 + depth * 0.35)})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(inside.x, inside.y, 2, 0, TAU);
      ctx.fillStyle = `rgba(${color},0.65)`;
      ctx.fill();
      ctx.restore();
    }
    if (animate) frame = requestAnimationFrame(draw);
  }
  function schedule() {
    if (!frame && !disposed) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const node of satellites) {
      node.width = node.button.offsetWidth;
      node.height = node.button.offsetHeight;
    }
    schedule();
  }
  function focus(event: FocusEvent) {
    const node = satellites.find((item) => item.button === event.target);
    if (
      node &&
      node.element.dataset.occlusion !== 'none' &&
      node.button.matches(':focus-visible')
    ) {
      // Bring a keyboard-selected rear tool to the front before it is read.
      const yaw = Math.atan2(-node.position.x, node.position.z);
      const pitch = Math.atan2(node.position.y, Math.hypot(node.position.x, node.position.z));
      orientation = multiply(axisRotation('x', pitch), axisRotation('y', yaw));
      parallax.x = parallax.y = parallax.targetX = parallax.targetY = 0;
      velocity.x = velocity.y = 0;
    }
    schedule();
  }
  function down(event: PointerEvent) {
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest('button') && !target.closest('.orbital-tool')) return;
    blockClick = false;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      touch: event.pointerType === 'touch',
    };
    velocity.x = 0;
    velocity.y = 0;
  }
  function move(event: PointerEvent) {
    const target = event.target as HTMLElement;
    if (drag && drag.id === event.pointerId) {
      const totalX = event.clientX - drag.startX,
        totalY = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(totalX, totalY) > 5) {
        if (drag.touch && Math.abs(totalY) > Math.abs(totalX)) {
          drag = null;
          return;
        }
        drag.moved = true;
        surface.setPointerCapture(event.pointerId);
        surface.dataset.dragging = 'true';
        surface.focus({ preventScroll: true });
      }
      if (drag.moved) {
        const dx = (event.clientX - drag.x) * 0.006;
        const dy = drag.touch ? 0 : (event.clientY - drag.y) * -0.006;
        orientation = multiply(axisRotation('y', dx), multiply(axisRotation('x', dy), orientation));
        velocity.x = Math.max(-0.045, Math.min(0.045, dx * 0.24));
        velocity.y = Math.max(-0.045, Math.min(0.045, dy * 0.24));
        if (event.cancelable) event.preventDefault();
        schedule();
      }
      drag.x = event.clientX;
      drag.y = event.clientY;
      return;
    }
    hoverHeld = !!target.closest('.orbital-tool');
    if (!hoverHeld && event.pointerType !== 'touch') {
      const rect = surface.getBoundingClientRect();
      parallax.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.24;
      parallax.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * -0.18;
    }
    schedule();
  }
  function finish(event: PointerEvent) {
    if (!drag || drag.id !== event.pointerId) return;
    blockClick = drag.moved;
    drag = null;
    delete surface.dataset.dragging;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    lastTime = 0;
    schedule();
  }
  function click(event: MouseEvent) {
    if (blockClick) {
      event.preventDefault();
      event.stopPropagation();
      blockClick = false;
    }
  }
  function hover(event: PointerEvent) {
    if (event.pointerType === 'touch' || drag) return;
    const target = event.type === 'pointerout' ? event.relatedTarget : event.target;
    hoverHeld =
      target instanceof Element && surface.contains(target) && !!target.closest('.orbital-tool');
    schedule();
  }
  function leave() {
    hoverHeld = false;
    parallax.targetX = 0;
    parallax.targetY = 0;
    schedule();
  }
  function reset() {
    orientation = initialOrientation();
    velocity.x = 0;
    velocity.y = 0;
    parallax.x = 0;
    parallax.y = 0;
    parallax.targetX = 0;
    parallax.targetY = 0;
    schedule();
  }
  function keyboard(event: KeyboardEvent) {
    if (event.target !== surface) return;
    const turns: Record<string, [number, number]> = {
      ArrowLeft: [-0.17, 0],
      ArrowRight: [0.17, 0],
      ArrowUp: [0, 0.17],
      ArrowDown: [0, -0.17],
    };
    if (event.key === 'Home') {
      event.preventDefault();
      reset();
      return;
    }
    const turn = turns[event.key];
    if (!turn) return;
    event.preventDefault();
    orientation = multiply(
      axisRotation('y', turn[0]),
      multiply(axisRotation('x', turn[1]), orientation),
    );
    velocity.x = 0;
    velocity.y = 0;
    schedule();
  }
  function visibility() {
    lastTime = 0;
    schedule();
  }
  function themeChange() {
    readPalette();
    // Finish the canvas palette before View Transitions captures the new page.
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    draw(performance.now());
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastTime = 0;
    schedule();
  });
  const themeObserver = new MutationObserver(readPalette);
  resizeObserver.observe(canvas);
  for (const node of satellites) resizeObserver.observe(node.button);
  intersection.observe(canvas);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-transition'],
  });
  surface.addEventListener('pointerdown', down);
  surface.addEventListener('pointermove', move, { passive: false });
  surface.addEventListener('pointerover', hover);
  surface.addEventListener('pointerout', hover);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
  surface.addEventListener('lostpointercapture', finish);
  surface.addEventListener('pointerleave', leave);
  surface.addEventListener('click', click, true);
  surface.addEventListener('keydown', keyboard);
  surface.addEventListener('focusin', focus);
  surface.addEventListener('focusout', schedule);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('themechange', themeChange);
  readPalette();
  resize();
  return {
    update(next) {
      options = next;
      lastTime = 0;
      if (next.reducedMotion) {
        parallax.x = 0;
        parallax.y = 0;
        velocity.x = 0;
        velocity.y = 0;
      }
      readPalette();
    },
    reset,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      if (drag && surface.hasPointerCapture(drag.id)) surface.releasePointerCapture(drag.id);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      surface.removeEventListener('pointerdown', down);
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerover', hover);
      surface.removeEventListener('pointerout', hover);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      surface.removeEventListener('lostpointercapture', finish);
      surface.removeEventListener('pointerleave', leave);
      surface.removeEventListener('click', click, true);
      surface.removeEventListener('keydown', keyboard);
      surface.removeEventListener('focusin', focus);
      surface.removeEventListener('focusout', schedule);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('themechange', themeChange);
    },
  };
}
