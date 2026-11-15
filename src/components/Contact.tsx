import {useEffect, useState} from "react";
import {profile, socials} from "../data/profile";
import {ExternalLink, SectionHeading} from "./ui";

export function Contact() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setStatus("Email address copied");
    } catch {
      setStatus(
        "Copying is blocked in this browser. Select the address above instead."
      );
    }
  };

  return (
    <section
      id="contact"
      className="wrap section"
      aria-labelledby="contact-title"
    >
      <SectionHeading
        id="contact-title"
        title="Get in touch"
        intro="Have a project to discuss, or just want to say hi? My inbox is open."
      />

      <a
        href={`mailto:${profile.email}`}
        className="t-email link block w-fit max-w-full break-all"
      >
        {profile.email}
      </a>
      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button type="button" className="btn btn-quiet" onClick={copyEmail}>
          Copy email address
        </button>
        <span className="font-semibold" role="status">
          {status}
        </span>
      </div>

      <dl className="mt-14 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-12">
        <div className="border-b border-line py-5 lg:col-span-2 lg:border-b-0">
          <dt className="t-meta">Phone</dt>
          <dd className="mt-1">
            <a
              href={profile.phone.href}
              className="link font-semibold tabular-nums"
            >
              {profile.phone.label}
            </a>
          </dd>
        </div>
        <div className="border-b border-line py-5 lg:col-span-3 lg:border-b-0">
          <dt className="t-meta">Based in</dt>
          <dd className="mt-1 font-semibold">{profile.location}</dd>
        </div>
        <div className="py-5 sm:col-span-2 lg:col-span-7">
          <dt className="t-meta">Elsewhere</dt>
          <dd className="mt-1">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {socials.map(social => (
                <li key={social.href}>
                  <ExternalLink
                    href={social.href}
                    className="link font-semibold"
                  >
                    {social.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
