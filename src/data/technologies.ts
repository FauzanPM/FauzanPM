export type Technology = {
  id: string;
  name: string;
  category: string;
  layer: number;
  purpose: string;
  usage: string;
  connections: string[];
  docs: string;
  position: { x: number; y: number; z: number };
};

// Shared by the accessible DOM nodes and the canvas projection.
export const technologies: Technology[] = [
  {
    id: 'aws',
    name: 'AWS',
    category: 'Cloud infrastructure',
    layer: 0,
    purpose:
      'Cloud compute and networking provide the foundation that application services run on.',
    usage:
      'I use EC2 instances and security groups to host services and control which network traffic reaches them.',
    connections: ['EC2', 'Security groups', 'Cloud compute'],
    docs: 'https://docs.aws.amazon.com/ec2/',
    position: { x: -0.8, y: -0.5, z: 0.54 },
  },
  {
    id: 'terraform',
    name: 'Terraform',
    category: 'Infrastructure as code',
    layer: 0,
    purpose:
      'Describes infrastructure in versioned configuration so changes can be planned and reproduced.',
    usage:
      'I use Terraform to provision cloud resources consistently, then hand off server configuration to Ansible.',
    connections: ['Provisioning', 'Versioned infrastructure', 'Ansible'],
    docs: 'https://developer.hashicorp.com/terraform/docs',
    position: { x: 0.15, y: -0.92, z: 0.58 },
  },
  {
    id: 'ansible',
    name: 'Ansible',
    category: 'Configuration automation',
    layer: 0,
    purpose:
      'Turns repeatable server setup into reusable playbooks that describe the desired configuration.',
    usage:
      'I use playbooks to configure hosts and prepare the dependencies that containerized applications need.',
    connections: ['Playbooks', 'Server configuration', 'Repeatability'],
    docs: 'https://docs.ansible.com/',
    position: { x: 0.87, y: -0.45, z: 0.4 },
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Containerization',
    layer: 1,
    purpose:
      'Packages an application and its dependencies into an image that can run consistently across environments.',
    usage:
      'I use Docker to build and run the application services in my DumbMerch and WaysHub deployment workflows.',
    connections: ['Images', 'Containers', 'Delivery pipelines'],
    docs: 'https://docs.docker.com/',
    position: { x: 0.92, y: 0.35, z: 0.42 },
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Container orchestration',
    layer: 1,
    purpose:
      'Coordinates containers across a cluster, reconciling running workloads with their desired state.',
    usage:
      'I work with k3s to organize containerized services and practice declarative application deployment.',
    connections: ['k3s', 'Workloads', 'Declarative deployment'],
    docs: 'https://kubernetes.io/docs/',
    position: { x: 0.12, y: 0.92, z: 0.57 },
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    category: 'Continuous delivery',
    layer: 1,
    purpose:
      'Connects source changes, builds, checks, and deployment steps into a repeatable pipeline.',
    usage:
      'I use Jenkins to automate the delivery path from a repository change to a containerized application release.',
    connections: ['Build pipelines', 'Automation', 'Docker'],
    docs: 'https://www.jenkins.io/doc/',
    position: { x: -0.86, y: 0.5, z: 0.47 },
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'Metrics & monitoring',
    layer: 2,
    purpose:
      'Collects time-series metrics so the behavior of services and infrastructure can be measured.',
    usage:
      'I use Prometheus as the metrics layer in a centralized monitoring setup, feeding operational data into dashboards.',
    connections: ['Metrics', 'Time series', 'Grafana'],
    docs: 'https://prometheus.io/docs/introduction/overview/',
    position: { x: -0.6, y: -0.58, z: -0.7 },
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'Operational visibility',
    layer: 2,
    purpose:
      'Turns collected metrics into dashboards that make system behavior easier to understand.',
    usage:
      'I use Grafana with Prometheus to inspect infrastructure and application signals after deployment.',
    connections: ['Dashboards', 'Prometheus', 'Investigation'],
    docs: 'https://grafana.com/docs/grafana/latest/',
    position: { x: 0.56, y: 0.56, z: -0.77 },
  },
];
