export const profile = {
  name: 'Pablo Bagliere',
  role: 'Senior Software Engineer',
  location: 'Rosario, Santa Fe, Argentina',
  timezone: 'GMT-3',
  summary: [
    'Senior Software Engineer con más de 5 años de experiencia desarrollando productos de software, integraciones empresariales e infraestructura cloud.',
    'Especializado en backend con Node.js, diseño de APIs, arquitectura de sistemas, DevOps e integración de plataformas. En MundoIT participé en el desarrollo y evolución del ERP Histrix, diseñando soluciones utilizadas por múltiples clientes e implementando proyectos completos: desde el análisis funcional hasta el despliegue en producción.',
    'Además del desarrollo, participé activamente en decisiones de arquitectura, definición tecnológica, implementación de infraestructura, automatización de procesos, observabilidad y optimización de costos operativos.',
  ],
};

export const skills: { category: string; items: string[] }[] = [
  {
    category: 'backend',
    items: ['Node.js', 'Express', 'Fastify', 'Hono', 'Python', 'FastAPI', 'PHP', 'Slim Framework'],
  },
  {
    category: 'frontend',
    items: [
      'React',
      'TanStack Start',
      'TanStack Query',
      'Next.js',
      'Vue 3',
      'Vite',
      'Zustand',
      'Pinia',
      'Tailwind CSS',
      'UnoCSS',
      'shadcn/ui',
    ],
  },
  {
    category: 'bases_de_datos',
    items: ['MySQL', 'PostgreSQL', 'Redis', 'DragonflyDB', 'SQLite'],
  },
  {
    category: 'cloud_infra',
    items: [
      'AWS',
      'Cloudflare Platform',
      'Docker',
      'Docker Compose',
      'Kubernetes',
      'Terraform',
      'DigitalOcean',
      'Linux',
      'Nginx',
    ],
  },
  {
    category: 'devops',
    items: [
      'GitHub Actions',
      'Bitbucket Pipelines',
      'Woodpecker CI',
      'SonarQube',
      'Trivy',
      'Dependency-Track',
      'Proxmox',
    ],
  },
  {
    category: 'cloudflare',
    items: [
      'Workers',
      'D1',
      'KV',
      'R2',
      'Queues',
      'Durable Objects',
      'Hyperdrive',
      'Access',
      'Zero Trust',
      'Tunnel',
    ],
  },
  {
    category: 'aws',
    items: [
      'Lambda',
      'S3',
      'SNS',
      'SQS',
      'SES',
      'CloudFront',
      'Route53',
      'CloudWatch',
      'IAM',
      'IAM Identity Center',
      'RDS',
    ],
  },
];

export const experience = {
  role: 'Senior Software Engineer',
  company: 'MegaDist SRL (MundoIT)',
  period: 'Sep 2021 → actualidad',
  description:
    'Empresa dedicada al desarrollo del ERP Histrix y soluciones de software para clientes de distintos rubros.',
  responsibilities: [
    'Desarrollo backend y frontend de aplicaciones empresariales',
    'Diseño e implementación de APIs REST',
    'Diseño de arquitectura para nuevos proyectos',
    'Definición de tecnologías y librerías utilizadas por el equipo',
    'Administración de infraestructura Linux',
    'Gestión de despliegues en producción',
    'Implementación de soluciones sobre AWS y Cloudflare',
    'Dockerización de aplicaciones',
    'Automatización de procesos de despliegue',
    'Integración de servicios externos',
    'Optimización de consultas SQL',
    'Reuniones con clientes para relevamiento de requerimientos técnicos',
    'Mentoría técnica y soporte al resto del equipo',
    'Resolución de incidentes complejos de infraestructura y producción',
  ],
};

export interface Project {
  slug: string;
  title: string;
  description: string;
  tech: string[];
}

export const projects: Project[] = [
  {
    slug: 'sync-platform',
    title: 'Sincronización entre sistemas empresariales',
    description:
      'Plataforma de sincronización entre WMS y Tango ERP basada en adaptadores, workers y colas. Evolucionó hasta convertirse en una plataforma reutilizable para múltiples integraciones del mismo cliente, incorporando nuevos sistemas con cambios mínimos.',
    tech: ['Fastify', 'BullMQ', 'MySQL', 'SQL Server', 'Docker', 'Node.js'],
  },
  {
    slug: 'mp-pos',
    title: 'Integración Mercado Pago POS',
    description:
      'Integración completa entre Histrix y Mercado Pago usando Cloudflare Workers como capa intermedia para desacoplar el ERP de la API del proveedor. Participé del proceso completo de homologación junto con Mercado Pago y el cliente.',
    tech: ['Cloudflare Workers', 'Hono', 'TypeScript'],
  },
  {
    slug: 'prisma-pos',
    title: 'Integración Prisma POS',
    description:
      'Implementación de principio a fin: reuniones técnicas con el proveedor y homologación con el cliente. Diseñé una solución para evitar restricciones geográficas de la API mediante infraestructura propia ubicada en Argentina.',
    tech: ['Node.js', 'Infraestructura propia', 'Homologación'],
  },
  {
    slug: 'fiserv-sitef',
    title: 'Integración Fiserv Sitef',
    description:
      'Servicio intermedio que encapsula el binario oficial de Sitef detrás de una API HTTP, permitiendo la integración con el ERP. Participé del proceso completo de homologación con Fiserv.',
    tech: ['Node.js', 'Express', 'Docker'],
  },
  {
    slug: 'whatsapp-platform',
    title: 'Plataforma WhatsApp Business',
    description:
      'Migración completa hacia una nueva arquitectura con Cloudflare Workers y TanStack Start. Centraliza conversaciones, automatiza respuestas y crea flujos para atención y toma de pedidos.',
    tech: ['Cloudflare Workers', 'TanStack Start', 'TypeScript'],
  },
  {
    slug: 'live-streaming',
    title: 'Streaming serverless en vivo',
    description:
      'Plataforma que inicia transmisiones en vivo automáticamente desde dispositivos móviles, sin intervención manual. Aprovisiona servidores bajo demanda en AWS y DigitalOcean, reduciendo la necesidad de soporte técnico durante los eventos.',
    tech: ['AWS Lambda', 'SNS', 'SQS', 'S3', 'DigitalOcean', 'Docker', 'OBS WebSocket'],
  },
  {
    slug: 'arba-api',
    title: 'API ARBA',
    description:
      'API centralizada utilizada por todas las instalaciones de Histrix para consultar información impositiva de ARBA y Santa Fe. Automatiza la actualización periódica de padrones y elimina lógica duplicada en cada instalación del ERP.',
    tech: ['Python', 'FastAPI'],
  },
  {
    slug: 'histrix-vue3',
    title: 'Aplicación Histrix · Vue 3',
    description:
      'Migración de la aplicación desde Vue 2 + Quasar 1 hacia Vue 3 + Quasar 2, incorporando TypeScript y manteniendo compatibilidad con instalaciones existentes.',
    tech: ['Vue 3', 'Quasar 2', 'TypeScript'],
  },
];

export const achievements: string[] = [
  'Consolidé la infraestructura de ~14 servidores a solo 2, reduciendo considerablemente los costos operativos',
  'Implementé observabilidad centralizada con SigNoz y OpenTelemetry para los servidores de clientes',
  'Implementé un Bastion SSH centralizado para mejorar la seguridad y la auditoría de accesos',
  'Migré el pipeline de CI desde Jenkins hacia Woodpecker CI, ejecutando pruebas automáticamente en cada push',
  'Migré múltiples aplicaciones desde Apache hacia Nginx + PHP-FPM',
  'Migré proyectos desde Vue 2 hacia Vue 3 incorporando TypeScript',
  'Migré la plataforma de WhatsApp desde una SPA con Vite hacia TanStack Start con SSR',
  'Implementé documentación técnica interna con MkDocs, protegida mediante Cloudflare Access',
  'Optimicé las búsquedas de un sitio de alto tráfico migrando de MySQL a Meilisearch: ~60% menos tiempo de respuesta',
  'Participé en la implementación de infraestructura productiva sobre AWS, Cloudflare y DigitalOcean',
];

export const extras = {
  education: {
    title: 'Técnico Informático Personal y Profesional',
    school: 'Escuela Técnica N.º 648',
    status: 'finalizado (2020)',
  },
  languages: [
    { name: 'español', level: 'nativo' },
    { name: 'inglés', level: 'básico — lectura de documentación técnica con apoyo de traducción' },
  ],
  workMode: [
    { key: 'preferida', value: 'remoto' },
    { key: 'híbrido', value: 'Rosario' },
    { key: 'viajes', value: 'ocasionales' },
  ],
  openSource: [
    {
      project: 'docker-ssl-proxy',
      detail: 'fix de conexiones SSL/WebSocket usadas en un sistema de streaming en vivo',
    },
    { project: 'comunidad PHP', detail: 'contribuciones menores a proyectos open source' },
  ],
};
