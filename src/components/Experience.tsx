import {jobs, toolkit} from "../data/profile";
import {SectionHeading} from "./ui";

export function Experience() {
  return (
    <section
      id="experience"
      className="wrap section"
      aria-labelledby="experience-title"
    >
      <SectionHeading id="experience-title" title="Experience" />

      <ol className="border-t border-ink">
        {jobs.map(job => (
          <li
            key={job.company}
            className="grid gap-x-10 gap-y-4 border-b border-line py-8 lg:grid-cols-12 lg:py-10"
          >
            <p className="t-meta tabular-nums lg:col-span-3 lg:pt-2">
              {job.from} to {job.to}
            </p>
            <div className="lg:col-span-9">
              <h3 className="t-h3">{job.title}</h3>
              <p className="mt-2 font-semibold">
                {job.company}
                <span className="font-normal text-ink-soft">, {job.place}</span>
              </p>
              <ul className="measure mt-5 list-disc space-y-1.5 pl-5 marker:text-line">
                {job.points.map(point => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <h3 className="t-h3 mt-20 lg:mt-28">Toolkit</h3>
      <dl className="mt-8 border-t border-ink">
        {toolkit.map(group => (
          <div
            key={group.area}
            className="grid gap-x-10 gap-y-1 border-b border-line py-4 lg:grid-cols-12"
          >
            <dt className="font-semibold lg:col-span-3">{group.area}</dt>
            <dd className="text-ink-soft lg:col-span-9">{group.tools}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
