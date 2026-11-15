/**
 * Everything the site says, in one place. Edit this file to change the content.
 *
 * Every claim here comes from the resume or from the projects themselves. Keep it that way:
 * a portfolio is only as strong as its least checkable sentence.
 */
import type {TableState} from "../lib/sim/types";

export interface LinkItem {
  label: string;
  href: string;
}

export const profile = {
  name: "Hassan Haroon",
  firstName: "Hassan",
  lastName: "Haroon",
  role: "Senior Software Engineer",
  employer: "Davaam",
  location: "Karachi, Pakistan",
  since: 2022,
  email: "hassanharoon321@gmail.com",
  phone: {label: "+92 321 2990048", href: "tel:+923212990048"},
  lead: "AI engineer in Karachi. I build computer-vision systems that turn ordinary CCTV cameras into live business data, and the web platforms and mobile apps around them."
};

export const facts: {label: string; value: string}[] = [
  {label: "Role", value: "Senior Software Engineer, Davaam"},
  {label: "Based in", value: "Karachi, Pakistan"},
  {label: "Shipping software since", value: "2022"},
  {label: "Works across", value: "Computer vision, web and mobile"}
];

export const nav: LinkItem[] = [
  {label: "AI systems", href: "#ai"},
  {label: "Products", href: "#products"},
  {label: "Experience", href: "#experience"},
  {label: "About", href: "#about"},
  {label: "Contact", href: "#contact"}
];

// ---------------------------------------------------------------------------------------------
// What I build
// ---------------------------------------------------------------------------------------------

export interface Discipline {
  name: string;
  summary: string;
  projects: LinkItem[];
  tools: string;
}

export const disciplines: Discipline[] = [
  {
    name: "AI systems",
    summary:
      "Detection, tracking and counting pipelines in Python that run next to the cameras and stream their results to live dashboards.",
    projects: [
      {
        label: "Restaurant Smart Automation System",
        href: "#restaurant-automation"
      },
      {label: "AI Footfall Counter", href: "#footfall-counter"}
    ],
    tools: "Python, YOLO, ByteTrack, OpenCV, FastAPI, Flask"
  },
  {
    name: "Web platforms",
    summary:
      "Dashboards, portals and SaaS products in React, Next.js and Node.js, built from the database schema to the deployed release.",
    projects: [
      {label: "Vertex 360", href: "#vertex-360"},
      {label: "Real Estate Source", href: "#real-estate-source"},
      {label: "ForwardMe", href: "#forwardme"},
      {label: "Spatial Think", href: "#spatial-think"},
      {label: "Davaam Dashboard", href: "#davaam-dashboard"}
    ],
    tools:
      "React, Next.js, TypeScript, Node.js, Express, MySQL, PostgreSQL, MongoDB"
  },
  {
    name: "Mobile apps",
    summary:
      "One React Native codebase released on both the App Store and Google Play, with secure sign-in, payments and top-ups.",
    projects: [
      {label: "Davaam Life for iOS and Android", href: "#davaam-life"}
    ],
    tools: "React Native, Redux Toolkit, Firebase, REST APIs"
  }
];

// ---------------------------------------------------------------------------------------------
// AI systems
// ---------------------------------------------------------------------------------------------

export interface CaseStudy {
  id: string;
  name: string;
  tagline: string;
  summary: string[];
  role: string;
  status: string;
  facts: {label: string; value: string}[];
  decisions: {title: string; body: string}[];
  pipeline: {name: string; detail: string}[];
  stack: string;
}

export const restaurantSystem: CaseStudy = {
  id: "restaurant-automation",
  name: "Restaurant Smart Automation System",
  tagline:
    "Live table occupancy and footfall from the cameras a restaurant already owns.",
  summary: [
    "A restaurant's CCTV already sees every table and the front door. This system reads those streams on a small computer inside the restaurant and gives the manager a live floor plan: which tables are free, occupied or waiting to be cleaned, how many guests are seated, how long they have stayed, and how many people have walked in today.",
    "It is three services with one contract between them. A Python vision service detects and tracks people, counts the entrance and runs a state machine for every table. A Node.js API takes in its events, keeps the live state and computes the analytics. A React dashboard shows the floor in real time over WebSockets, and lets staff draw a table zone on a camera snapshot in a few seconds."
  ],
  role: "Architecture and the full build: vision service, API and dashboard.",
  status:
    "Working end-to-end demo with 35 automated tests. The next step is a pilot on a restaurant's own footage.",
  facts: [
    {
      label: "Analytics",
      value:
        "Peak-hour heatmap, daily footfall, dwell time, table turnover and utilisation"
    },
    {
      label: "Setup",
      value:
        "Draw table zones and the entrance line on a camera snapshot, then drag the floor plan into shape"
    },
    {label: "Tests", value: "28 on the vision engines, 7 on the API"}
  ],
  decisions: [
    {
      title: "Occupancy is a counting problem, not a tracking problem",
      body: "Tracking IDs break the moment people sit down and hide behind each other. So the engine never follows individuals around the room. It counts people sitting still inside each table's zone, takes a high percentile of that count over a sliding window to ride out occlusion, and feeds the result to a state machine."
    },
    {
      title: "Two cameras, one answer",
      body: "When two cameras cover the same table, each one misses different people. The engine takes the higher count, because occlusion hides guests far more often than it invents them."
    },
    {
      title: "A guest who steps away is still a guest",
      body: "Standing up for a phone call doesn't end the visit. The table moves to away, the visit stays open, and dwell time keeps running until the guest returns or the absence timer expires."
    },
    {
      title: "An outage looks like an outage",
      body: "If every camera covering a table goes offline, the table shows no signal. It never falls back to available. A gap you can see is better than a number you can't trust."
    },
    {
      title: "Privacy is built into the pipeline",
      body: "Faces are pixelated before any frame leaves the vision engine. Nothing is recorded and nobody is identified. The design is edge-first: video stays inside the restaurant and only structured events travel."
    },
    {
      title: "The entrance line is a band",
      body: "Someone hovering in a doorway can cross a thin line five times. The counter uses a two-sided band with hysteresis, so a crossing only counts when a person is confirmed on one side and then confirmed on the other."
    }
  ],
  pipeline: [
    {name: "Cameras", detail: "Existing CCTV, read over the local network"},
    {
      name: "Vision service",
      detail: "Detect, track, count the door, read each table zone"
    },
    {name: "Events", detail: "Small structured messages, safe to retry"},
    {name: "API", detail: "Live state, visits, analytics"},
    {name: "Dashboard", detail: "Live floor plan, charts, setup"}
  ],
  stack:
    "Python, YOLO11, ByteTrack, FastAPI, OpenCV, Node.js, Express, TypeScript, Socket.IO, SQLite, React, Tailwind CSS, Recharts"
};

export const footfallCounter: CaseStudy = {
  id: "footfall-counter",
  name: "AI Footfall Counter",
  tagline:
    "Counts who walks in, who walks out and who came together, across every camera on site.",
  summary: [
    "A people counter that runs on ordinary CCTV. It detects and tracks people in live camera streams, counts each crossing of a doorway line in the right direction, and reports entries, exits, people inside, and hourly and daily trends to a live dashboard.",
    "It goes further than a raw count. People who arrive together are counted once as a group, likely families are flagged, returning visitors can be recognised so they aren't counted as new, and zones drawn around a display measure how long people stay there."
  ],
  role: "The multi-camera runtime, the REST API and the live dashboard.",
  status: "Tested on five live cameras through one network video recorder.",
  facts: [
    {
      label: "Dashboard",
      value:
        "Camera wall, live annotated video, hourly and daily charts, group and zone panels"
    },
    {
      label: "Storage",
      value: "Every crossing, group and zone visit logged to SQLite"
    },
    {
      label: "API",
      value: "Stats, trends, events and live video, filterable by camera"
    }
  ],
  decisions: [
    {
      title: "A line with a dead zone",
      body: "People hesitate in doorways. A crossing only counts once a track has cleared a dead zone around the line and stayed on the far side for several frames, and every track has a cooldown. Jitter can't double-count."
    },
    {
      title: "People who arrive together count once",
      body: "Two people who stay within a body-height and a half of each other and move at the same speed are linked. A linked set is one group, counted once when its first member crosses. A group with a child-sized member is flagged as a likely family."
    },
    {
      title: "A returning visitor isn't a new visitor",
      body: "An optional face-matching step recognises someone who has already come in, through any door, and logs a repeat visit instead of a new one. Face data is biometric, so the feature is a switch, and the embeddings stay in a local database."
    },
    {
      title: "One camera failing doesn't stop the count",
      body: "Each camera runs on its own thread inside one process. A camera that drops out is retried every ten seconds while the others keep counting."
    },
    {
      title: "Setup happens in the browser",
      body: "Open a camera on the dashboard, click two points across the doorway, check that the arrow points the way people walk in, and save. The line is written to the config and counting starts immediately, with no restart."
    },
    {
      title: "It runs on the hardware you have",
      body: "The engine picks an NVIDIA GPU if there is one, then an Apple GPU, then the CPU, and the model size is one line of config. The same code runs on a workstation or a laptop."
    }
  ],
  pipeline: [
    {name: "Cameras", detail: "Live streams from the recorder"},
    {name: "Detection", detail: "YOLO11 finds every person in the frame"},
    {name: "Tracking", detail: "Each person keeps one ID across frames"},
    {name: "Counting", detail: "Line crossings, groups, zones, repeat visits"},
    {name: "Dashboard", detail: "Live totals and trends per camera"}
  ],
  stack:
    "Python, YOLO11, ByteTrack and BoT-SORT, OpenCV (YuNet and SFace), Flask, SQLite, React, Vite, Tailwind CSS"
};

/** How a table moves between states, with the production timings from the platform. */
export const tableTransitions: {
  from: TableState | "any";
  to: TableState | "unknown";
  when: string;
}[] = [
  {
    from: "available",
    to: "occupied",
    when: "Someone has been seated for 30 seconds"
  },
  {
    from: "occupied",
    to: "away",
    when: "Nobody has been visible for 15 seconds"
  },
  {
    from: "away",
    to: "occupied",
    when: "A guest is seated again. Same visit, same timer"
  },
  {
    from: "away",
    to: "cleaning",
    when: "The table has stayed empty for 5 minutes"
  },
  {
    from: "cleaning",
    to: "available",
    when: "Staff tap Mark as clean, a busser is seen at the table, or 15 minutes pass"
  },
  {from: "reserved", to: "occupied", when: "The booked party sits down"},
  {
    from: "any",
    to: "unknown",
    when: "Every camera covering the table is offline"
  }
];

export const stateNames: Record<TableState | "unknown" | "any", string> = {
  available: "Available",
  occupied: "Occupied",
  away: "Away",
  cleaning: "Needs cleaning",
  reserved: "Reserved",
  unknown: "No signal",
  any: "Any state"
};

// ---------------------------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  kind: string;
  region?: string;
  description: string;
  links: LinkItem[];
}

export const products: Product[] = [
  {
    id: "vertex-360",
    name: "Vertex 360",
    kind: "NDIS management platform",
    region: "Australia",
    description:
      "Helps providers under Australia's National Disability Insurance Scheme run their business: stay compliant, track client progress, and reach support plans, risk assessments and worker checks in real time.",
    links: [{label: "Visit vertex360.io", href: "https://vertex360.io/"}]
  },
  {
    id: "real-estate-source",
    name: "Real Estate Source Inc",
    kind: "Real-estate transaction portal",
    region: "United States",
    description:
      "Realtors create and manage transaction forms, track property deals and manage a network of more than 50 realtors. I built its dashboards, workflows and modules in React on top of REST APIs.",
    links: [
      {
        label: "Visit realestatesourceinc.info",
        href: "https://realestatesourceinc.info/"
      }
    ]
  },
  {
    id: "spatial-think",
    name: "Spatial Think",
    kind: "3D workforce training platform",
    description:
      "A 3D platform for workforce training, documentation and collaboration that brings together IoT, AR and VR, and real-time simulations to track skills and project progress. I worked on the frontend, the immersive modules and API performance.",
    links: [
      {label: "Visit spatialthink.com", href: "https://spatialthink.com/"}
    ]
  },
  {
    id: "forwardme",
    name: "ForwardMe",
    kind: "Global parcel forwarding",
    region: "United States",
    description:
      "Lets shoppers buy from US stores and ship internationally. I designed its product pages and UI components in Next.js.",
    links: [{label: "Visit forwardme.com", href: "https://www.forwardme.com/"}]
  },
  {
    id: "cvvlogs",
    name: "Cvvlogs",
    kind: "Video-resume job portal",
    description:
      "Candidates apply with a video resume. Recruiters post jobs, schedule interviews and hire from the same place.",
    links: [
      {
        label: "See Cvvlogs on LinkedIn",
        href: "https://www.linkedin.com/company/cvvlogs-usa/"
      }
    ]
  },
  {
    id: "davaam-dashboard",
    name: "Davaam Dashboard",
    kind: "IoT vending machine monitoring",
    region: "Pakistan",
    description:
      "A real-time dashboard for a fleet of connected vending machines: live machine data over WebSockets, analytics charts, and backend APIs for machine data, alerts and reporting.",
    links: [
      {label: "Visit davaam.app", href: "https://davaam.app/auth/sign-in"}
    ]
  },
  {
    id: "davaam-life",
    name: "Davaam Life",
    kind: "E-commerce and top-up app for iOS and Android",
    region: "Pakistan",
    description:
      "A React Native app on the App Store and Google Play, with secure sign-in, payments, top-ups and account management.",
    links: [
      {
        label: "Open on the App Store",
        href: "https://apps.apple.com/pk/app/davaam-life/id6447618612"
      },
      {
        label: "Find it on Google Play",
        href: "https://play.google.com/store/search?q=davaam&c=apps&hl=en"
      }
    ]
  }
];

// ---------------------------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------------------------

export interface Job {
  company: string;
  place: string;
  title: string;
  from: string;
  to: string;
  points: string[];
}

export const jobs: Job[] = [
  {
    company: "Davaam",
    place: "Karachi",
    title: "Senior Software Engineer",
    from: "December 2022",
    to: "Present",
    points: [
      "Lead development of the React Native mobile apps and the React and Node.js web applications.",
      "Architect the backend systems in Node.js, Express and MySQL.",
      "Own deployments end to end on AWS, Heroku and Netlify.",
      "Plan product work, reporting and feature delivery directly with the CEO.",
      "Mentor junior developers and run code reviews.",
      "Build and optimise APIs for large-scale applications serving global clients.",
      "Build computer-vision systems in Python: a multi-camera footfall counter and a restaurant occupancy platform."
    ]
  },
  {
    company: "Bearplex",
    place: "Lahore",
    title: "Associate Software Developer",
    from: "June 2022",
    to: "December 2022",
    points: [
      "Developed complete web applications with React, Express and Node.js.",
      "Implemented reusable UI components and API integrations.",
      "Worked with senior engineers to improve performance and code quality.",
      "Contributed to several client applications for international markets."
    ]
  },
  {
    company: "Devnation Techstars",
    place: "Lahore",
    title: "MERN Stack Developer",
    from: "January 2022",
    to: "June 2022",
    points: [
      "Developed complete web applications with React, Express and Node.js.",
      "Focused on backend systems in Node.js, Express and MongoDB, deployed on AWS.",
      "Built server-side modules, authentication flows and REST APIs.",
      "Deployed backend services for both training and production use."
    ]
  }
];

// ---------------------------------------------------------------------------------------------
// Toolkit
// ---------------------------------------------------------------------------------------------

export const toolkit: {area: string; tools: string}[] = [
  {area: "Languages", tools: "JavaScript (ES6+), TypeScript, Python, SQL"},
  {
    area: "Web",
    tools:
      "React, Next.js, Redux Toolkit, Tailwind CSS, Sass, HTML5 and CSS3, progressive web apps"
  },
  {area: "Mobile", tools: "React Native for iOS and Android"},
  {
    area: "Backend",
    tools:
      "Node.js, Express, FastAPI, Flask, REST API design, WebSockets and Socket.IO, JWT and OAuth"
  },
  {area: "Data", tools: "MySQL, PostgreSQL, MongoDB, Firestore, SQLite"},
  {
    area: "AI and computer vision",
    tools:
      "YOLO object detection, ByteTrack and BoT-SORT tracking, OpenCV, face detection and matching, GPU inference on NVIDIA and Apple silicon"
  },
  {
    area: "Cloud and delivery",
    tools:
      "AWS (EC2, RDS Aurora, VPC), Heroku, Netlify, DigitalOcean, Firebase, Docker, GitHub Actions"
  }
];

// ---------------------------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------------------------

export const about: string[] = [
  "I'm an engineer based in Karachi. My newest work is in AI: computer-vision systems that run on live camera feeds. It stands on the production software I've been shipping since 2022: web platforms, mobile apps and the backends behind them.",
  "I started with the fundamentals. I earned my JavaScript certification at Expertizo, then trained as a web and mobile engineer at Saylani Mass IT Training, where I picked up backend development and DevOps alongside the JavaScript ecosystem. I studied computer science at Benazir Bhutto Shaheed University, and took part in blockchain research there that led to a published paper.",
  "My first engineering roles were in Lahore. At Devnation Techstars I worked mostly on the backend: Node.js, Express and MongoDB, authentication flows and REST APIs, deployed on AWS. At Bearplex I built complete web applications for international clients, working closely with senior engineers on performance and code quality.",
  "Since December 2022 I've been at Davaam in Karachi, where I lead development across the stack. I built the real-time dashboard that monitors the company's connected vending machines, and the Davaam Life app that customers use on iOS and Android to top up and shop. I architect the Node.js and MySQL backends, own the deployments, plan product work directly with the CEO, and mentor the junior developers on the team.",
  "Along the way I've worked on products used far from Karachi: Vertex 360, a compliance platform for disability-care providers in Australia; Real Estate Source, a transaction portal for a network of realtors in the United States; ForwardMe, a global parcel-forwarding service; and Spatial Think, a 3D workforce-training platform.",
  "In 2026 my work moved into AI. I build computer-vision systems that count people at a doorway and read table occupancy from a restaurant's existing cameras. What I enjoy most there is what I enjoy in any system: finding the design where the hard problem never has to be solved. A restaurant doesn't need to recognise a face to know a table is free."
];

export const principles: {title: string; body: string}[] = [
  {
    title: "Design the hard problem away",
    body: "The most reliable way to solve a hard problem is to arrange the system so it never comes up. My occupancy engine never needs to know who anyone is. It counts people per table zone instead of following them across cameras."
  },
  {
    title: "Show gaps as gaps",
    body: "When a camera drops, its tables say no signal. They never quietly fall back to available. A system should be honest about what it doesn't know."
  },
  {
    title: "Collect less",
    body: "Faces are pixelated on the device and video stays in the building. Data you never collect is data you never have to protect."
  },
  {
    title: "Count by hand first",
    body: "The test for a counter is simple: record an hour, count it by hand, and compare. I tune against that before I quote a number."
  }
];

export const credentials: {title: string; issuer: string; detail?: string}[] = [
  {
    title: "BS in Computer Science",
    issuer: "Benazir Bhutto Shaheed University, Karachi",
    detail: "2018 to 2022"
  },
  {title: "Certified JavaScript Developer", issuer: "Expertizo"},
  {title: "Web and Mobile Engineer", issuer: "Saylani Mass IT Training"},
  {title: "Get Connected", issuer: "Cisco, through Saylani Mass IT Training"}
];

// ---------------------------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------------------------

export const socials: LinkItem[] = [
  {label: "GitHub", href: "https://github.com/hassanharoon321"},
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/hassan-haroon-88740916a/"
  },
  {label: "GitLab", href: "https://gitlab.com/hassanharoon321"},
  {
    label: "Stack Overflow",
    href: "https://stackoverflow.com/users/12292696/hassan-haroon"
  },
  {label: "LeetCode", href: "https://leetcode.com/hassanharoon321/"},
  {label: "Medium", href: "https://medium.com/@hassanharoon321"},
  {label: "Fiverr", href: "https://www.fiverr.com/hassan_haroon21/"},
  {label: "Facebook", href: "https://www.facebook.com/hassanharoon007/"}
];
