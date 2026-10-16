import { ArrowDownRight, ArrowUpRight, MapPin } from 'lucide-react';
import { assetUrl } from '../lib/assets';
import { experience } from '../data/portfolio';

export function About({ openCV }: { openCV: () => void }) {
  return (
    <section id="about" className="section about-section" tabIndex={-1}>
      <div className="section-kicker mono">
        <span className="section-index">03 /</span> THE PERSON BEHIND THE SYSTEMS
      </div>
      <div className="about-layout">
        <div className="about-portrait">
          <div className="portrait-grid" />
          <img
            src={assetUrl('img/profil.png')}
            alt="Fauzan Prima Mukti"
            width="1000"
            height="1000"
            loading="lazy"
          />
          <div className="portrait-name">
            <span className="mono">ENGINEER. BUILDER. ALWAYS LEARNING.</span>
            <strong>Fauzan Prima Mukti</strong>
            <span>
              <MapPin size={13} />
              Batam, Indonesia
            </span>
          </div>
          <ArrowDownRight className="portrait-arrow" size={32} strokeWidth={1} />
        </div>
        <div className="about-copy">
          <h2>
            Curious by nature.
            <br />
            <span>Engineer by practice.</span>
          </h2>
          <p>
            I’m Fauzan, a DevOps engineer who enjoys making complex systems feel a little simpler. I
            connect the dots between code, infrastructure, and the people who depend on them.
          </p>
          <p>
            My path has taken me through backend development, interface design, and cloud
            operations. That perspective shapes how I build: with care for both the system and the
            experience around it.
          </p>
          <button className="text-link" onClick={openCV}>
            A little more about my journey <ArrowUpRight size={17} />
          </button>
          <div className="about-facts">
            <div>
              <span className="mono">BASED IN</span>
              <strong>
                Indonesia <span className="tiny-flag" aria-hidden="true" />
              </strong>
            </div>
            <div>
              <span className="mono">EDUCATION</span>
              <strong>B.Sc. Informatics</strong>
            </div>
            <div>
              <span className="mono">APPROACH</span>
              <strong>Always evolving.</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="experience-header">
        <span className="mono">A FEW CHAPTERS SO FAR</span>
        <span className="mono">2024 — 2026</span>
      </div>
      <div className="experience-list">
        {experience.map((item) => (
          <article className="experience-item" key={item.role}>
            <span className="mono experience-date">{item.date}</span>
            <div>
              <h3>{item.role}</h3>
              <span>{item.company}</span>
            </div>
            <p>{item.detail}</p>
            <ArrowUpRight size={18} aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
