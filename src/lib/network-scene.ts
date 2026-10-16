type SceneOptions = { mode: number; reducedMotion: boolean; paused: boolean };
type Point = { x: number; y: number; z: number };
const TAU = Math.PI * 2;

// One renderer owns its observers, animation frame, and pointer listeners.
// Rendering stops when the scene is offscreen, paused, or the document is hidden.
export function createNetworkScene(canvas: HTMLCanvasElement, options: SceneOptions) {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const ctx = context;
  let width = 0,
    height = 0,
    frame = 0,
    angle = 0.55,
    lastTime = 0;
  let visible = true,
    disposed = false;
  const pointer = { x: 0, y: 0 };
  const colors = ['184,247,179', '189,181,251', '129,213,230'];
  const color = colors[options.mode];
  const points: Point[] = Array.from({ length: 1500 }, (_, index) => {
    const y = 1 - (index / 1499) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
  });
  function project(p: Point, size: number) {
    const rotation = angle + pointer.x * 0.14;
    const x = p.x * Math.cos(rotation) + p.z * Math.sin(rotation);
    const z = -p.x * Math.sin(rotation) + p.z * Math.cos(rotation);
    const tilt = -0.22 + pointer.y * 0.1;
    const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
    const depth = p.y * Math.sin(tilt) + z * Math.cos(tilt);
    const perspective = 3.6 / (3.6 - depth * 0.32);
    return {
      x: width / 2 + x * size * perspective,
      y: height / 2 + y * size * perspective,
      z: depth,
    };
  }
  function draw(time: number) {
    frame = 0;
    if (disposed) return;
    const animate = !options.paused && !options.reducedMotion && visible && !document.hidden;
    if (animate && lastTime) angle += Math.min(time - lastTime, 40) * 0.000065;
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width * 0.31, height * 0.33);
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.4,
      width / 2,
      height / 2,
      radius * 1.6,
    );
    glow.addColorStop(0, `rgba(${color},0.055)`);
    glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Orbital planes give the illustration volume without loading a 3D library.
    for (let orbit = 0; orbit < 3; orbit++) {
      ctx.beginPath();
      const rotation = -0.4 + orbit * 0.7;
      const orbitRadius = radius * (1.31 + orbit * 0.12);
      for (let step = 0; step <= 160; step++) {
        const t = (step / 160) * TAU;
        const x = Math.cos(t) * orbitRadius;
        const y = Math.sin(t) * orbitRadius * 0.32;
        const px = width / 2 + x * Math.cos(rotation) - y * Math.sin(rotation);
        const py = height / 2 + x * Math.sin(rotation) + y * Math.cos(rotation);
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(${color},${orbit === options.mode ? 0.28 : 0.09})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      const t = angle * (1.8 + orbit * 0.5) + orbit * 2;
      const x = Math.cos(t) * orbitRadius,
        y = Math.sin(t) * orbitRadius * 0.32;
      const px = width / 2 + x * Math.cos(rotation) - y * Math.sin(rotation);
      const py = height / 2 + x * Math.sin(rotation) + y * Math.cos(rotation);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, TAU);
      ctx.fillStyle = `rgba(${color},0.9)`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, TAU);
      ctx.strokeStyle = `rgba(${color},0.25)`;
      ctx.stroke();
    }

    // Latitude and longitude lines remain subtle behind the point field.
    for (let line = 0; line < 12; line++) {
      const longitude = (line / 12) * Math.PI;
      ctx.beginPath();
      for (let step = 0; step <= 90; step++) {
        const t = (step / 90) * TAU;
        const p = project(
          {
            x: Math.cos(t) * Math.cos(longitude),
            y: Math.sin(t),
            z: Math.cos(t) * Math.sin(longitude),
          },
          radius,
        );
        if (step === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(${color},0.065)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    const projected = points.map((point, index) => ({ ...project(point, radius), index }));
    projected.sort((a, b) => a.z - b.z);
    for (const p of projected) {
      const bright = (Math.sin(p.index * 1.37) + 1) / 2;
      const alpha = (0.13 + ((p.z + 1) / 2) * 0.68) * (0.45 + bright * 0.55);
      ctx.fillStyle = `rgba(${color},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (0.65 + ((p.z + 1) / 2) * 0.9) * (p.index % 47 === 0 ? 1.7 : 1), 0, TAU);
      ctx.fill();
      if (p.index % 83 === 0 && p.z > 0.2) {
        ctx.strokeStyle = `rgba(${color},0.16)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, TAU);
        ctx.stroke();
      }
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
    schedule();
  }
  function move(event: PointerEvent) {
    if (options.reducedMotion || options.paused) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointer.y = (event.clientY - rect.top) / rect.height - 0.5;
  }
  function visibility() {
    lastTime = 0;
    schedule();
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastTime = 0;
    schedule();
  });
  resizeObserver.observe(canvas);
  intersection.observe(canvas);
  canvas.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  resize();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    canvas.removeEventListener('pointermove', move);
    document.removeEventListener('visibilitychange', visibility);
  };
}
