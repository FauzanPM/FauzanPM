import { useEffect, useReducer, useState } from 'react';
import {
  Activity,
  Box,
  Check,
  CircleAlert,
  GitCommitHorizontal,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { initialPipeline, pipelineReducer, pipelineStages } from '../lib/pipeline';

const icons = [GitCommitHorizontal, Box, ShieldCheck, Upload, Activity];

export function PipelineLab() {
  const [state, dispatch] = useReducer(pipelineReducer, initialPipeline);
  const [inspected, setInspected] = useState<number | null>(null);
  useEffect(() => {
    if (state.phase !== 'running') return;
    const timer = setTimeout(() => dispatch({ type: 'tick' }), 900);
    return () => clearTimeout(timer);
  }, [state.phase, state.step]);
  const selected = inspected ?? state.step;
  const status = {
    ready: 'Ready when you are.',
    running: `${pipelineStages[state.step].name} in progress…`,
    paused: 'Paused. Resume to continue.',
    success: 'Release complete. Every gate passed.',
    failed: 'Verification failed. Deployment blocked.',
  }[state.phase];
  return (
    <div className={`pipeline-lab pipeline-${state.phase}`}>
      <div className="pipeline-heading">
        <div>
          <span className="mono">A CLOSER LOOK / INTERACTIVE WALKTHROUGH</span>
          <h3>A commit’s journey.</h3>
          <p>Explore the stages. Run a release. See why the checks matter.</p>
        </div>
        <span className="simulation-badge mono">SIMULATED WORKFLOW</span>
      </div>
      <div className="pipeline-stages" aria-label="Delivery pipeline stages">
        {pipelineStages.map((stage, index) => {
          const complete = state.phase === 'success' || index < state.step;
          const failed = state.phase === 'failed' && index === state.step;
          const active = state.phase !== 'ready' && index === state.step && !complete;
          const Icon = complete ? Check : failed ? CircleAlert : icons[index];
          return (
            <button
              key={stage.name}
              aria-pressed={selected === index}
              className={`pipeline-stage ${complete ? 'stage-complete' : ''} ${active ? 'stage-active' : ''} ${failed ? 'stage-failed' : ''}`}
              onClick={() => setInspected(index)}
            >
              <span className="stage-number mono">0{index + 1}</span>
              <span className="stage-icon">
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <span className="stage-name">{stage.name}</span>
              <span className="stage-status mono">
                {complete
                  ? 'PASSED'
                  : failed
                    ? 'BLOCKED'
                    : active
                      ? state.phase === 'paused'
                        ? 'PAUSED'
                        : 'RUNNING'
                      : 'WAITING'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pipeline-description">
        <span className="mono">
          0{selected + 1} / {pipelineStages[selected].name.toUpperCase()}
        </span>
        <p>{pipelineStages[selected].detail}</p>
      </div>
      <div className="pipeline-controls">
        <div className="pipeline-buttons">
          {state.phase === 'running' ? (
            <button className="button button-primary" onClick={() => dispatch({ type: 'pause' })}>
              <Pause size={14} />
              Pause simulation
            </button>
          ) : (
            <button
              className="button button-primary"
              onClick={() => {
                setInspected(null);
                dispatch({ type: 'start' });
              }}
            >
              <Play size={14} />
              {state.phase === 'paused'
                ? 'Resume simulation'
                : state.phase === 'ready'
                  ? 'Run simulation'
                  : 'Run again'}
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Reset simulation"
            onClick={() => {
              setInspected(null);
              dispatch({ type: 'reset' });
            }}
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <label className="failure-control">
          <input
            type="checkbox"
            checked={state.failCheck}
            disabled={state.phase !== 'ready'}
            onChange={(event) => dispatch({ type: 'setFailure', enabled: event.target.checked })}
          />
          Simulate a failed check
        </label>
        <p className="pipeline-status" role="status">
          {status}
        </p>
      </div>
    </div>
  );
}
