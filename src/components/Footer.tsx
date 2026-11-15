import {profile} from "../data/profile";

export function Footer() {
  return (
    <footer className="wrap border-t border-line py-8">
      <div className="t-meta flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <p>
          © {new Date().getFullYear()} {profile.name}. Built with React,
          TypeScript and Tailwind CSS.
        </p>
        <a href="#top" className="link">
          Back to the top
        </a>
      </div>
    </footer>
  );
}
