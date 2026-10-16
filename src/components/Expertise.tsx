import { useState } from 'react';
import { ArrowUpRight, Check, Code2, Terminal } from 'lucide-react';
import { capabilities } from '../data/portfolio';
import { PipelineLab } from './PipelineLab';

export function Expertise() {
  const [selected, setSelected] = useState(0);
  const capability = capabilities[selected];
  return (
    <section id="expertise" className="section expertise-section" tabIndex={-1}>
      <div className="section-kicker mono">
        <span className="section-index">02 /</span> THE TOOLKIT
      </div>
      <div className="section-heading">
        <h2>
          Every layer.
          <br />
          <span>One connected mindset.</span>
        </h2>
        <p>
          Tools are the starting point.
          <br />
          How they work together is where it gets interesting.
        </p>
      </div>
      <div className="expertise-layout">
        <div
          className="expertise-tabs"
          role="tablist"
          aria-label="Engineering capabilities"
          aria-orientation="vertical"
        >
          {capabilities.map((item, index) => (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              role="tab"
              aria-selected={selected === index}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
                  next = (index + 1) % capabilities.length;
                else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
                  next = (index + capabilities.length - 1) % capabilities.length;
                else if (event.key === 'Home') next = 0;
                else if (event.key === 'End') next = capabilities.length - 1;
                else return;
                event.preventDefault();
                setSelected(next);
                document.getElementById(`tab-${capabilities[next].id}`)?.focus();
              }}
            >
              <span className="mono">{item.number}</span>
              <span>{item.label}</span>
              <ArrowUpRight size={19} />
            </button>
          ))}
          <div className="toolkit-note">
            <Code2 size={20} />
            <p>
              Less friction.
              <br />
              More room to build.
            </p>
          </div>
        </div>
        <div
          className="expertise-panel"
          role="tabpanel"
          id={`panel-${capability.id}`}
          aria-labelledby={`tab-${capability.id}`}
          tabIndex={0}
          key={capability.id}
        >
          <div className="capability-copy">
            <span className="capability-icon">
              <Terminal size={22} strokeWidth={1.5} />
            </span>
            <h3>{capability.heading}</h3>
            <p>{capability.description}</p>
            <div className="capability-tools">
              {capability.tools.map((tool) => (
                <span key={tool}>
                  <Check size={12} />
                  {tool}
                </span>
              ))}
            </div>
          </div>
          <div className="code-panel">
            <div className="code-header mono">
              <span>
                <i />
                <i />
                <i />
              </span>
              system.map
            </div>
            <pre>{capability.code.join('\n')}</pre>
            <div className="code-footer mono">
              <span className="status-dot" />
              {capability.note}
            </div>
          </div>
        </div>
      </div>
      <PipelineLab />
    </section>
  );
}
