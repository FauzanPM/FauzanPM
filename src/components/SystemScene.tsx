import { useEffect, useRef, useState } from 'react';
import { Activity, Box, Cloud, Pause, Play } from 'lucide-react';
import { createNetworkScene } from '../lib/network-scene';
import { SparkMark } from './BrandIcons';
import { useMotionPreference } from '../hooks/useMotionPreference';

const layers = [
  {
    label: 'Infrastructure',
    eyebrow: 'CONNECTED BY DESIGN',
    title: 'Cloud infrastructure',
    icon: Cloud,
    note: 'Repeatable foundations. Connected services.',
    tag: 'terraform · ansible',
  },
  {
    label: 'Delivery',
    eyebrow: 'BUILT TO KEEP MOVING',
    title: 'Continuous delivery',
    icon: Box,
    note: 'From a commit to a running application.',
    tag: 'docker · jenkins',
  },
  {
    label: 'Observability',
    eyebrow: 'VISIBILITY AT EVERY LAYER',
    title: 'Observable systems',
    icon: Activity,
    note: 'Understand the signals behind the system.',
    tag: 'prometheus · grafana',
  },
];

export default function SystemScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMotionPreference();
  useEffect(() => {
    if (canvas.current) return createNetworkScene(canvas.current, { mode, paused, reducedMotion });
  }, [mode, paused, reducedMotion]);
  const layer = layers[mode];
  const Icon = layer.icon;
  return (
    <div className={`system-scene scene-mode-${mode}`}>
      <div className="scene-topline mono">
        <span>
          <i className="status-dot" /> AN INTERCONNECTED WORLD
        </span>
        <span>FIG. 001</span>
      </div>
      <div className="scene-visual">
        <div className="scene-grid" aria-hidden="true" />
        <canvas ref={canvas} aria-hidden="true" />
        <span className="scene-coordinate coordinate-top mono" aria-hidden="true">
          01° 02′ N
        </span>
        <span className="scene-coordinate coordinate-bottom mono" aria-hidden="true">
          104° 02′ E
        </span>
        <div className="scene-node node-primary" aria-live="polite">
          <span className="node-icon">
            <Icon size={17} />
          </span>
          <div>
            <span className="mono node-eyebrow">{layer.eyebrow}</span>
            <strong>{layer.title}</strong>
          </div>
          <i className="status-dot" />
        </div>
        <div className="scene-node node-secondary">
          <SparkMark className="node-cross" />
          <div>
            <span className="mono node-eyebrow">DESIGNED TO WORK TOGETHER</span>
            <span className="mono node-tag">{layer.tag}</span>
          </div>
        </div>
        <span className="scene-cross cross-one" aria-hidden="true">
          +
        </span>
        <span className="scene-cross cross-two" aria-hidden="true">
          +
        </span>
        <button
          className="scene-pause icon-button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? 'Resume visualization' : 'Pause visualization'}
          disabled={reducedMotion}
          title={reducedMotion ? 'Animation disabled by your motion preference' : undefined}
        >
          {paused || reducedMotion ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
      <div className="scene-bottom">
        <div className="scene-tabs" aria-label="Architecture visualization layer">
          {layers.map((item, index) => (
            <button key={item.label} aria-pressed={mode === index} onClick={() => setMode(index)}>
              <span className="mode-dot" />
              {item.label}
            </button>
          ))}
        </div>
        <p className="scene-note mono" aria-live="polite">
          {layer.note}
        </p>
      </div>
    </div>
  );
}
