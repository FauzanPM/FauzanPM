import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Cloud,
  Database,
  GitBranch,
  Globe,
  Radio,
  Server,
} from 'lucide-react';
import { projects } from '../data/portfolio';
import type { Project } from '../data/portfolio';
import { Dialog } from './Dialog';

function ArchitecturePreview({ project }: { project: Project }) {
  const commerce = project.id === 'dumbmerch';
  return (
    <div className={`project-visual visual-${project.color}`} aria-hidden="true">
      <div className="diagram-label mono">
        <span>{commerce ? 'COMMERCE INFRASTRUCTURE' : 'HYBRID CLOUD PLATFORM'}</span>
        <span>↗</span>
      </div>
      <div className="architecture-diagram">
        <div className="diagram-source">
          <GitBranch size={14} />
          <span>source</span>
        </div>
        <div className="diagram-track track-left">
          <span />
        </div>
        <div className="diagram-hub">
          <div className="hub-halo" />
          <div className="hub-icon">
            {commerce ? (
              <Box size={28} strokeWidth={1.25} />
            ) : (
              <Radio size={28} strokeWidth={1.25} />
            )}
          </div>
          <span>{commerce ? 'DumbMerch' : 'WaysHub'}</span>
          <small>{commerce ? 'containerized services' : 'streaming services'}</small>
        </div>
        <div className="diagram-track track-right">
          <span />
        </div>
        <div className="diagram-targets">
          <div>
            <Cloud size={15} />
            {commerce ? 'cloud' : 'cloud node'}
          </div>
          <div>
            {commerce ? <Database size={15} /> : <Server size={15} />}
            {commerce ? 'database' : 'local node'}
          </div>
        </div>
      </div>
      <div className="diagram-bottom mono">
        <span>
          <i className="status-dot" /> ARCHITECTURE OVERVIEW
        </span>
        <span>{commerce ? 'BUILD → SHIP → OBSERVE' : 'CONNECT → STREAM → OBSERVE'}</span>
      </div>
    </div>
  );
}

export function Projects({ onSelect }: { onSelect: (project: Project) => void }) {
  const [filter, setFilter] = useState('All work');
  const filtered = projects.filter(
    (project) => filter === 'All work' || project.category === filter,
  );
  return (
    <section id="work" className="section work-section" tabIndex={-1}>
      <div className="section-kicker mono">
        <span className="section-index">01 /</span> SELECTED WORK
      </div>
      <div className="section-heading">
        <h2>
          Ideas, put into <span>production.</span>
        </h2>
        <p>
          A closer look at the systems I build.
          <br />
          From the first commit to the infrastructure underneath.
        </p>
      </div>
      <div className="work-toolbar">
        <div className="filter-list" aria-label="Filter projects">
          {['All work', 'E-commerce', 'Streaming'].map((item) => (
            <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>
              {item}
              {item === 'All work' && <span>02</span>}
            </button>
          ))}
        </div>
        <span className="mono work-count" aria-live="polite">
          {String(filtered.length).padStart(2, '0')} PROJECTS
        </span>
      </div>
      <div className="projects-grid">
        {filtered.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-visual-wrap">
              <ArchitecturePreview project={project} />
              <button
                className="project-visual-button"
                onClick={() => onSelect(project)}
                aria-label={`Explore ${project.name} project`}
              />
            </div>
            <div className="project-info">
              <div className="project-title-row">
                <div>
                  <span className="mono project-type">
                    {project.number} / {project.category}
                  </span>
                  <h3>
                    <button onClick={() => onSelect(project)}>{project.name}</button>
                  </h3>
                </div>
                <button
                  className="project-arrow"
                  aria-label={`Read ${project.name} case study`}
                  onClick={() => onSelect(project)}
                >
                  <ArrowUpRight size={25} strokeWidth={1.5} />
                </button>
              </div>
              <p>{project.description}</p>
              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <a
        className="work-github subtle-link"
        href="https://github.com/FauzanPM/automation"
        target="_blank"
        rel="noreferrer"
      >
        More of the process, out in the open.{' '}
        <span>
          Explore GitHub <ArrowUpRight size={15} />
        </span>
      </a>
    </section>
  );
}

export function ProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <Dialog title={`${project.name} case study`} onClose={onClose} className="project-dialog">
      <div className="project-dialog-heading">
        <span className="section-kicker mono">
          {project.number} / PROJECT NOTES · {project.category}
        </span>
        <h2>
          {project.name}
          <span>↗</span>
        </h2>
        <p>{project.tagline}</p>
      </div>
      <ArchitecturePreview project={project} />
      <div className="project-dialog-content">
        <span className="mono section-kicker">THE CHALLENGE</span>
        <p className="challenge-text">{project.challenge}</p>
        <div className="approach-grid">
          {project.approach.map((item, index) => (
            <div key={item.title}>
              <span className="mono">
                0{index + 1} <ArrowDownRight size={14} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <div className="project-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <img
          className="project-original"
          src={project.image}
          alt={`${project.name} original project overview and technology stack`}
          loading="lazy"
        />
        <p className="project-document-note">
          Explore the implementation in the repository and original project documentation.
        </p>
        <div className="dialog-actions">
          <a className="button button-primary" href={project.repo} target="_blank" rel="noreferrer">
            View source <GitBranch size={16} />
          </a>
          <a className="button button-outline" href={project.pdf} target="_blank" rel="noreferrer">
            Project documentation <ArrowUpRight size={16} />
          </a>
        </div>
        <p className="mono document-caption">
          <Globe size={12} /> Architecture illustration is conceptual; implementation details live
          in the linked project.
        </p>
      </div>
    </Dialog>
  );
}
