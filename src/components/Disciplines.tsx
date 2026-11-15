import {disciplines} from "../data/profile";
import {SectionHeading} from "./ui";

export function Disciplines() {
  return (
    <section className="wrap section" aria-labelledby="disciplines-title">
      <SectionHeading
        id="disciplines-title"
        title="What I build"
        intro="Three kinds of engineering that usually sit in three different teams."
      />

      <div className="grid gap-y-12 lg:grid-cols-3">
        {disciplines.map(discipline => (
          <article
            key={discipline.name}
            className="border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pr-8 lg:pl-8 lg:first:border-l-0 lg:first:pl-0"
          >
            <h3 className="t-h3">{discipline.name}</h3>
            <p className="mt-4">{discipline.summary}</p>

            <dl className="mt-7 space-y-5">
              <div>
                <dt className="t-meta">Projects</dt>
                <dd className="mt-1">
                  <ul>
                    {discipline.projects.map(project => (
                      <li key={project.href}>
                        <a href={project.href} className="link font-semibold">
                          {project.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="t-meta">Tools</dt>
                <dd className="mt-1">{discipline.tools}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
