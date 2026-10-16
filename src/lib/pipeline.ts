export const pipelineStages = [
  {
    name: 'Commit',
    detail: 'A code change starts the workflow. The same source revision follows every stage.',
  },
  {
    name: 'Build',
    detail:
      'Package the application into a versioned artifact so environments receive the same build.',
  },
  {
    name: 'Verify',
    detail: 'Run checks before deployment. A failed check stops the release at this gate.',
  },
  { name: 'Deploy', detail: 'Promote the verified artifact into the target environment.' },
  { name: 'Observe', detail: 'Check service health and watch the signals after the release.' },
] as const;

export type PipelineState = {
  phase: 'ready' | 'running' | 'paused' | 'success' | 'failed';
  step: number;
  failCheck: boolean;
};
export type PipelineEvent =
  { type: 'start' | 'tick' | 'pause' | 'reset' } | { type: 'setFailure'; enabled: boolean };
export const initialPipeline: PipelineState = { phase: 'ready', step: 0, failCheck: false };

export function pipelineReducer(state: PipelineState, event: PipelineEvent): PipelineState {
  switch (event.type) {
    case 'setFailure':
      return state.phase === 'ready' ? { ...state, failCheck: event.enabled } : state;
    case 'reset':
      return { ...initialPipeline, failCheck: state.failCheck };
    case 'start':
      return state.phase === 'running'
        ? state
        : { ...state, phase: 'running', step: state.phase === 'paused' ? state.step : 0 };
    case 'pause':
      return state.phase === 'running' ? { ...state, phase: 'paused' } : state;
    case 'tick': {
      if (state.phase !== 'running') return state;
      if (state.step === 2 && state.failCheck) return { ...state, phase: 'failed' };
      if (state.step === pipelineStages.length - 1) return { ...state, phase: 'success' };
      return { ...state, step: state.step + 1 };
    }
  }
}
