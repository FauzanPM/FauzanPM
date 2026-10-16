import { assetUrl } from '../lib/assets';

export const profile = {
  name: 'Fauzan Prima Mukti',
  email: 'fauzanprimamukti@gmail.com',
  github: 'https://github.com/FauzanPM',
  linkedin: 'https://www.linkedin.com/in/fauzanprimamukti/',
  location: 'Batam, Indonesia',
};

export type Project = {
  id: string;
  number: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  color: 'mint' | 'lavender';
  tags: string[];
  repo: string;
  pdf: string;
  image: string;
  challenge: string;
  approach: { title: string; text: string }[];
};

export const projects: Project[] = [
  {
    id: 'dumbmerch',
    number: '01',
    name: 'DumbMerch',
    category: 'E-commerce',
    tagline: 'From source code to a connected commerce platform.',
    description:
      'An end-to-end DevOps implementation connecting infrastructure, automated delivery, and monitoring for a microservices e-commerce application.',
    color: 'mint',
    tags: ['Terraform', 'Docker', 'Jenkins', 'AWS'],
    repo: 'https://github.com/FauzanPM/automation/tree/main/dumbmerch',
    pdf: assetUrl('/pdf/project1.pdf'),
    image: assetUrl('/img/project1.png'),
    challenge:
      'Bring application services, cloud infrastructure, and delivery workflows together into a deployment that is repeatable and understandable.',
    approach: [
      {
        title: 'Provision with intent',
        text: 'Terraform and Ansible support repeatable infrastructure provisioning and server configuration.',
      },
      {
        title: 'Connect the delivery path',
        text: 'Jenkins and Docker connect application changes to containerized service deployments.',
      },
      {
        title: 'Make behavior visible',
        text: 'Prometheus and Grafana provide a monitoring layer alongside the application and its infrastructure.',
      },
    ],
  },
  {
    id: 'wayshub',
    number: '02',
    name: 'WaysHub',
    category: 'Streaming',
    tagline: 'A hybrid foundation for stories worth streaming.',
    description:
      'A hybrid cloud infrastructure project for a video streaming application, bringing service deployment and operational visibility into one workflow.',
    color: 'lavender',
    tags: ['Docker', 'NGINX', 'CI/CD', 'Hybrid cloud'],
    repo: 'https://github.com/FauzanPM/automation/tree/main/wayshub',
    pdf: assetUrl('/pdf/project2.pdf'),
    image: assetUrl('/img/project2.png'),
    challenge:
      'Connect the moving parts of a streaming platform across a hybrid infrastructure while keeping deployments and operations manageable.',
    approach: [
      {
        title: 'Connect environments',
        text: 'A hybrid infrastructure brings together the compute and application services needed by the streaming platform.',
      },
      {
        title: 'Package the application',
        text: 'Containerized services and automated delivery workflows make application releases more consistent.',
      },
      {
        title: 'Keep operations observable',
        text: 'Monitoring and a reverse proxy support day-to-day operation of the deployed platform.',
      },
    ],
  },
];

export const capabilities = [
  {
    id: 'cloud',
    label: 'Cloud & infrastructure',
    number: '01',
    heading: 'A thoughtful foundation.',
    description:
      'Infrastructure should be repeatable, readable, and built around the application. I work from provisioning to configuration to make every environment easier to understand.',
    tools: ['AWS', 'Google Cloud', 'Biznet Gio', 'Terraform', 'Ansible'],
    code: [
      'infrastructure/',
      '  ├─ environments/',
      '  │  ├─ development',
      '  │  └─ production',
      '  ├─ modules/',
      '  └─ configuration/',
    ],
    note: 'Provision. Configure. Repeat.',
  },
  {
    id: 'delivery',
    label: 'Containers & delivery',
    number: '02',
    heading: 'A shorter path to shipped.',
    description:
      'From a Git commit to a running service: I connect builds, containers, and deployment pipelines so that shipping becomes a process you can follow.',
    tools: ['Docker', 'Kubernetes (k3s)', 'Jenkins', 'GitHub Actions', 'Helm'],
    code: [
      'delivery/',
      '  ├─ source',
      '  ├─ build & verify',
      '  ├─ container registry',
      '  ├─ deploy',
      '  └─ health checks',
    ],
    note: 'Commit. Build. Deliver.',
  },
  {
    id: 'observe',
    label: 'Monitoring & reliability',
    number: '03',
    heading: 'See beyond the deploy.',
    description:
      'A running service is only the beginning. Metrics, dashboards, and clear traffic routing help turn system behavior into useful operational context.',
    tools: ['Prometheus', 'Grafana', 'NGINX', 'Linux', 'HTTPS / TLS'],
    code: [
      'observability/',
      '  ├─ services',
      '  ├─ metrics',
      '  ├─ dashboards',
      '  ├─ alerts',
      '  └─ investigation',
    ],
    note: 'Measure. Understand. Improve.',
  },
] as const;

export const experience = [
  {
    date: 'JAN 2025 — FEB 2026',
    role: 'DevOps Engineer',
    company: 'PT. DumbWays Indonesia Teknologi',
    detail:
      'End-to-end infrastructure, CI/CD workflows, containerized deployments, and centralized monitoring.',
  },
  {
    date: 'SEP — DEC 2024',
    role: 'UI/UX Designer & Analyst',
    company: 'SevenInc · Internship',
    detail:
      'Marketplace wireframes, interface design, and collaboration with the development team.',
  },
  {
    date: 'MAR — AUG 2024',
    role: 'Backend & Deployment Engineer',
    company: 'SMK Kartika Nusantara · Project',
    detail:
      'RESTful APIs, relational data, and deployment for an online parking management website.',
  },
];
