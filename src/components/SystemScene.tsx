import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Box,
  Cloud,
  Code2,
  Gauge,
  Hexagon,
  Layers,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Workflow,
  X,
} from 'lucide-react';
import { createNetworkScene } from '../lib/network-scene';
import type { NetworkScene } from '../lib/network-scene';
import { technologies } from '../data/technologies';
import { useMotionPreference } from '../hooks/useMotionPreference';
import './scene.css';

const toolIcons = {
  aws: Cloud,
  terraform: Layers,
  ansible: Code2,
  docker: Box,
  kubernetes: Hexagon,
  jenkins: Workflow,
  prometheus: Activity,
  grafana: Gauge,
};
const layers = [
  {
    label: 'Infrastructure',
    title: 'Cloud infrastructure',
    icon: Cloud,
    note: 'Repeatable foundations. Connected services.',
  },
  {
    label: 'Delivery',
    title: 'Continuous delivery',
    icon: Box,
    note: 'From a commit to a running application.',
  },
  {
    label: 'Observability',
    title: 'Observable systems',
    icon: Activity,
    note: 'Understand the signals behind the system.',
  },
];

export default function SystemScene() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const engine = useRef<NetworkScene | null>(null);
  const anchors = useRef(new Map<string, HTMLDivElement>());
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const inspector = useRef<HTMLElement>(null);
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reducedMotion = useMotionPreference();
  const selected = technologies.find((tool) => tool.id === selectedId);
  const options = useRef({ mode, paused, reducedMotion, engaged: !!selected });
  options.current = { mode, paused, reducedMotion, engaged: !!selected };

  useEffect(() => {
    if (!canvas.current || !surface.current) return;
    const nodes = technologies.flatMap((tool) => {
      const element = anchors.current.get(tool.id);
      return element ? [{ element, position: tool.position, layer: tool.layer }] : [];
    });
    const controller = createNetworkScene(canvas.current, surface.current, nodes, options.current);
    engine.current = controller;
    return () => {
      controller.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.update(options.current);
  }, [mode, paused, reducedMotion, selectedId]);
  useEffect(() => {
    if (selectedId) inspector.current?.focus({ preventScroll: true });
  }, [selectedId]);
  const closeInspector = useCallback(() => {
    const trigger = selectedId ? buttons.current.get(selectedId) : null;
    setSelectedId(null);
    trigger?.focus({ preventScroll: true });
  }, [selectedId]);
  useEffect(() => {
    if (!selectedId) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        closeInspector();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [selectedId, closeInspector]);

  const layer = layers[mode];
  const LayerIcon = layer.icon;
  const SelectedIcon = selected ? toolIcons[selected.id as keyof typeof toolIcons] : Box;
  return (
    <div className={`system-scene scene-mode-${mode} ${selected ? 'is-inspecting' : ''}`}>
      <div className="scene-topline mono">
        <span>
          <i className="status-dot" /> AN INTERCONNECTED WORLD
        </span>
        <span>EXPLORE / 08 TOOLS</span>
      </div>
      <div className="scene-layer-heading">
        <span className="scene-layer-icon">
          <LayerIcon size={14} />
        </span>
        <strong aria-live="polite">{layer.title}</strong>
        <span className="mono">CONNECTED BY DESIGN</span>
      </div>
      <div className="scene-visual">
        <div className="scene-grid" aria-hidden="true" />
        <div
          className="scene-orbit"
          ref={surface}
          role="group"
          tabIndex={0}
          aria-label="Rotate technology globe"
          aria-describedby="globe-instructions"
        >
          <canvas ref={canvas} aria-hidden="true" />
          {technologies.map((tool) => {
            const Icon = toolIcons[tool.id as keyof typeof toolIcons];
            return (
              <div
                className="orbital-tool-anchor"
                key={tool.id}
                data-tool-id={tool.id}
                ref={(element) => {
                  if (element) anchors.current.set(tool.id, element);
                  else anchors.current.delete(tool.id);
                }}
              >
                <button
                  className={`orbital-tool orbital-${tool.id}`}
                  ref={(element) => {
                    if (element) buttons.current.set(tool.id, element);
                    else buttons.current.delete(tool.id);
                  }}
                  aria-label={`Explore ${tool.name}`}
                  aria-expanded={selectedId === tool.id}
                  aria-controls={selectedId === tool.id ? 'technology-inspector' : undefined}
                  onClick={() => {
                    setMode(tool.layer);
                    setSelectedId(tool.id);
                  }}
                >
                  <span className="orbital-tool-icon">
                    <Icon size={16} strokeWidth={1.6} />
                  </span>
                  <span>{tool.name}</span>
                  <span className="orbital-node-dot" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        <span className="scene-coordinate coordinate-top mono" aria-hidden="true">
          01° 02′ N
        </span>
        <span className="scene-coordinate coordinate-bottom mono" aria-hidden="true">
          104° 02′ E
        </span>
        <div className="scene-interaction-hint mono" id="globe-instructions">
          <MousePointer2 size={11} />
          <span>
            Drag to rotate · select a tool
            <span className="scene-sr-only">
              . Focus the globe and use arrow keys to rotate. Press Home to reset its orientation.
            </span>
          </span>
        </div>
        <div className="scene-controls">
          <button
            className="icon-button"
            onClick={() => engine.current?.reset()}
            aria-label="Reset globe orientation"
            title="Reset orientation"
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="icon-button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? 'Resume visualization' : 'Pause visualization'}
            disabled={reducedMotion}
            title={
              reducedMotion
                ? 'Auto-rotation is off for reduced motion; you can still drag the globe.'
                : paused
                  ? 'Resume auto-rotation'
                  : 'Pause auto-rotation'
            }
          >
            {paused || reducedMotion ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
        {selected && (
          <section
            className="scene-inspector"
            ref={inspector}
            id="technology-inspector"
            role="region"
            aria-label={`${selected.name} details`}
            tabIndex={-1}
          >
            <div className="inspector-heading">
              <span className="inspector-tool-icon">
                <SelectedIcon size={22} strokeWidth={1.5} />
              </span>
              <div>
                <span className="mono">{selected.category}</span>
                <h2>{selected.name}</h2>
              </div>
              <button
                className="icon-button"
                onClick={closeInspector}
                aria-label="Close tool details"
              >
                <X size={16} />
              </button>
            </div>
            <p className="inspector-purpose">{selected.purpose}</p>
            <div className="inspector-usage">
              <span className="mono">IN MY WORKFLOW</span>
              <p>{selected.usage}</p>
            </div>
            <div className="inspector-tags">
              {selected.connections.map((connection) => (
                <span key={connection}>{connection}</span>
              ))}
            </div>
            <a className="inspector-docs" href={selected.docs} target="_blank" rel="noreferrer">
              Official documentation <ArrowUpRight size={14} />
            </a>
          </section>
        )}
      </div>
      <div className="scene-bottom">
        <div className="scene-tabs" aria-label="Architecture visualization layer">
          {layers.map((item, index) => (
            <button
              key={item.label}
              aria-pressed={mode === index}
              onClick={() => {
                setMode(index);
                setSelectedId(null);
              }}
            >
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
