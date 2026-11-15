import {facts, profile} from "../data/profile";
import {LivePlan} from "./LivePlan";

export function Hero() {
  return (
    <section id="top" className="wrap pt-10 pb-16 lg:pt-12 lg:pb-24">
      {/* On wide screens the plan sits beside the name and the facts close the left column.
          On narrow ones the order is name, plan, facts. */}
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:grid-rows-[auto_1fr] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="name-box">
          <h1 className="t-name">
            <span className="lg:block">{profile.firstName}</span>{" "}
            <span className="lg:block">{profile.lastName}</span>
          </h1>
          <p className="t-lead mt-7 max-w-[35ch] lg:mt-9">{profile.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ai" className="btn btn-primary">
              See my work
            </a>
            <a href={`mailto:${profile.email}`} className="btn btn-quiet">
              Email me
            </a>
          </div>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <LivePlan />
        </div>

        <dl className="grid border-t border-line sm:grid-cols-2 lg:col-start-1 lg:row-start-2 lg:grid-cols-1 lg:self-end xl:grid-cols-2">
          {facts.map(fact => (
            <div key={fact.label} className="border-b border-line py-3.5 pr-6">
              <dt className="t-meta">{fact.label}</dt>
              <dd className="mt-0.5 font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
