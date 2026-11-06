import type { SiteSetting } from "@/lib/types";

export function Footer({ settings }: { settings: SiteSetting }) {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span aria-hidden="true">{settings.siteName}</span>
        <a href="#top" className="footer__top">
          Back to top <i>↑</i>
        </a>
      </div>
      <p className="footer__copy">{settings.copyright}</p>
      <ul className="footer__credits">
        {settings.credits.map((c) => (
          <li key={c.url}>
            <a href={c.url} target="_blank" rel="noopener noreferrer">
              {c.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="footer__team">
        {settings.team.map((m, i) => (
          <span key={m.name}>
            {m.url ? (
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                {m.name}
              </a>
            ) : (
              m.name
            )}
            {i < settings.team.length - 1 && ", "}
          </span>
        ))}
      </p>
    </footer>
  );
}
