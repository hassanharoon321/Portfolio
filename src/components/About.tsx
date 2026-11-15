import {about, credentials, principles} from "../data/profile";
import {SectionHeading} from "./ui";

export function About() {
  const [opening, ...rest] = about;

  return (
    <section id="about" className="wrap section" aria-labelledby="about-title">
      <SectionHeading id="about-title" title="About" />

      <div className="grid gap-x-12 gap-y-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="t-lead measure">{opening}</p>
          <div className="measure mt-7 space-y-5">
            {rest.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <aside
          className="lg:col-span-4 lg:col-start-9"
          aria-labelledby="credentials-title"
        >
          <h3 id="credentials-title" className="t-h4">
            Education and certifications
          </h3>
          <ul className="mt-5 border-t border-line">
            {credentials.map(credential => (
              <li key={credential.title} className="border-b border-line py-4">
                <strong className="block">{credential.title}</strong>
                <span className="text-ink-soft">{credential.issuer}</span>
                {credential.detail && (
                  <span className="t-meta block tabular-nums">
                    {credential.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <h3 className="t-h3 mt-20 lg:mt-28">How I work</h3>
      <ul className="mt-8 grid gap-x-12 gap-y-10 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {principles.map(principle => (
          <li key={principle.title}>
            <h4 className="t-h4 lg:min-h-[2em]">{principle.title}</h4>
            <p className="mt-3 text-ink-soft">{principle.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
