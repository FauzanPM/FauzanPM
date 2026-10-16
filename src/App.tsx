import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Box,
  Cloud,
  Code2,
  FileText,
  GitBranch,
  Hexagon,
  Layers,
  MapPin,
  Workflow,
} from 'lucide-react';
import { Navigation } from './components/Navigation';
import { Projects, ProjectDialog } from './components/Projects';
import { Expertise } from './components/Expertise';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { CommandPalette } from './components/CommandPalette';
import { Dialog } from './components/Dialog';
import { SparkMark } from './components/BrandIcons';
import { assetUrl } from './lib/assets';
import type { Project } from './data/portfolio';

const SystemScene = lazy(() => import('./components/SystemScene'));
type Overlay = { kind: 'commands' } | { kind: 'cv' } | { kind: 'project'; project: Project } | null;

export function App() {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const openCommands = useCallback(() => setOverlay({ kind: 'commands' }), []);
  const openCV = useCallback(() => setOverlay({ kind: 'cv' }), []);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOverlay((current) => (current?.kind === 'commands' ? null : { kind: 'commands' }));
      }
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navigation openCommands={openCommands} />
      <main id="main-content" tabIndex={-1}>
        <section id="home" className="hero-section" tabIndex={-1}>
          <div className="hero-copy">
            <div className="hero-eyebrow mono">
              <span className="status-dot" /> FAUZAN PRIMA MUKTI{' '}
              <span className="eyebrow-divider">/</span> DEVOPS ENGINEER
            </div>
            <h1>
              Infrastructure.
              <br />
              <span>Made human.</span>
              <SparkMark className="headline-period" />
            </h1>
            <p className="hero-description">
              I turn complex infrastructure into seamless experiences. Building the systems behind
              what comes next.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">
                Explore my work <ArrowUpRight size={18} />
              </a>
              <button className="button button-quiet" onClick={openCV}>
                <FileText size={16} />
                View résumé <ArrowRight size={15} />
              </button>
            </div>
            <div className="hero-location">
              <span className="location-symbol">
                <MapPin size={15} strokeWidth={1.5} />
              </span>
              <span>
                Based in Indonesia.
                <br />
                <span className="location-muted">Building beyond borders.</span>
              </span>
            </div>
          </div>
          <Suspense
            fallback={
              <div
                className="scene-loading"
                aria-label="Loading interactive architecture illustration"
              >
                <span />
              </div>
            }
          >
            <SystemScene />
          </Suspense>
          <div className="hero-bottom mono">
            <a href="#work">
              <span className="scroll-icon">
                <ArrowDown size={13} />
              </span>
              SCROLL TO EXPLORE
            </a>
            <span>CLOUD MINDSET. HUMAN TOUCH.</span>
          </div>
        </section>
        <div className="technology-strip">
          <span className="mono technology-label">
            THE BUILDING
            <br />
            BLOCKS
          </span>
          <div className="technology-logos">
            <span>
              <Cloud />
              AWS
            </span>
            <span>
              <Box />
              Docker
            </span>
            <span>
              <Hexagon />
              Kubernetes
            </span>
            <span>
              <Layers />
              Terraform
            </span>
            <span>
              <Workflow />
              Jenkins
            </span>
            <span>
              <Code2 />
              Ansible
            </span>
            <span>
              <GitBranch />
              GitHub
            </span>
          </div>
        </div>
        <Projects onSelect={(project) => setOverlay({ kind: 'project', project })} />
        <Expertise />
        <div className="philosophy-banner">
          <SparkMark className="philosophy-asterisk" />
          <p>
            The best infrastructure is the kind
            <br />
            that lets <span>great ideas happen.</span>
          </p>
          <span className="mono">
            A SIMPLE BELIEF.
            <br />A LOT OF POSSIBILITIES.
          </span>
        </div>
        <About openCV={openCV} />
        <Contact openCommands={openCommands} />
      </main>
      {overlay?.kind === 'commands' && (
        <CommandPalette key="commands" onClose={() => setOverlay(null)} openCV={openCV} />
      )}
      {overlay?.kind === 'project' && (
        <ProjectDialog
          key={overlay.project.id}
          project={overlay.project}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay?.kind === 'cv' && (
        <Dialog
          key="cv"
          title="Fauzan Prima Mukti résumé"
          onClose={() => setOverlay(null)}
          className="cv-dialog"
        >
          <div className="cv-header">
            <div>
              <span className="mono section-kicker">THE FULL PICTURE</span>
              <h2>My résumé.</h2>
            </div>
            <a
              href={assetUrl('pdf/cv.pdf')}
              download="Fauzan-Prima-Mukti-CV.pdf"
              className="button button-primary"
            >
              Download PDF <ArrowDown size={16} />
            </a>
          </div>
          <iframe src={assetUrl('pdf/cv.pdf')} title="Fauzan Prima Mukti résumé PDF" />
          <p className="cv-fallback">
            PDF not displaying?{' '}
            <a href={assetUrl('pdf/cv.pdf')} target="_blank" rel="noreferrer">
              Open it in a new tab <ArrowUpRight size={13} />
            </a>
          </p>
        </Dialog>
      )}
    </>
  );
}
