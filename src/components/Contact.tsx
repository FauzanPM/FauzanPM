import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react';
import { BrandMark, GitHubIcon, LinkedInIcon } from './BrandIcons';
import { profile } from '../data/portfolio';

export function Contact({ openCommands }: { openCommands: () => void }) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopyStatus('idle'), 4000);
  }
  return (
    <>
      <section id="contact" className="contact-section" tabIndex={-1}>
        <div className="contact-orbit" aria-hidden="true" />
        <div className="section-kicker mono">
          <span className="status-dot" /> GOOD THINGS START WITH A CONVERSATION
        </div>
        <div className="contact-heading">
          <h2>
            Let’s build
            <br />
            <span>something that lasts.</span>
          </h2>
          <a href={`mailto:${profile.email}`} className="contact-circle" aria-label="Email Fauzan">
            <ArrowUpRight size={48} strokeWidth={1.3} />
          </a>
        </div>
        <div className="contact-bottom">
          <p>
            Have a project in mind, an interesting challenge,
            <br />
            or just want to say hello? I’d love to hear from you.
          </p>
          <div className="contact-email">
            <a href={`mailto:${profile.email}`}>
              {profile.email}
              <ArrowRight size={18} />
            </a>
            <button
              className="icon-button"
              aria-label={copyStatus === 'copied' ? 'Email copied' : 'Copy email address'}
              onClick={copyEmail}
            >
              {copyStatus === 'copied' ? <Check size={17} /> : <Copy size={17} />}
            </button>
            <span className="copy-status" role="status">
              {copyStatus === 'copied'
                ? 'Copied to clipboard'
                : copyStatus === 'failed'
                  ? 'Copy unavailable — select the email or open your mail app.'
                  : ''}
            </span>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="footer-main">
          <a href="#home" className="brand">
            <span className="brand-mark">
              <BrandMark />
            </span>
            <span>
              fauzan<span className="brand-suffix">.pm</span>
            </span>
          </a>
          <span className="footer-message">Thoughtfully built. Always in progress.</span>
          <div className="footer-socials">
            <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
              <GitHubIcon size={18} />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile"
            >
              <LinkedInIcon size={18} />
            </a>
            <a href="#home" aria-label="Back to top">
              <ArrowUp size={19} />
            </a>
          </div>
        </div>
        <div className="footer-bottom mono">
          <span>© {new Date().getFullYear()} FAUZAN PRIMA MUKTI</span>
          <button onClick={openCommands}>
            BUILT FOR THE CURIOUS <span>⌘ K</span>
          </button>
          <span>
            BATAM, INDONESIA <i className="status-dot" />
          </span>
        </div>
      </footer>
    </>
  );
}
