// ─── Resume data (static, rarely changes) ───

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null; // null = "Present"
  bullets: string[];
  techTags: string[];
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  graduationDate: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  badgeUrl?: string;
}

// ─── Work Experience ───

export const workExperience: WorkExperience[] = [
  {
    id: "capital-one",
    company: "Capital One",
    role: "Software Engineer",
    startDate: "Jan 2022",
    endDate: null,
    bullets: [
      "Built real-time event-driven microservices with Go and Python on AWS",
      "Designed REST APIs (API Gateway + Lambda) handling 10K+ daily requests",
      "Implemented CI/CD pipelines with GitHub Actions, CloudFormation, and Docker",
      "Leveraged Kafka & SQS for async messaging; Redis for caching layer",
      "Wrote 300+ unit/integration tests achieving 85%+ code coverage",
    ],
    techTags: ["Go", "Python", "AWS", "Kafka", "Redis", "Docker"],
  },
  {
    id: "picoportal",
    company: "PicoPortal (IDOC)",
    role: "ML Engineer / SWE",
    startDate: "Dec 2020",
    endDate: "Dec 2021",
    bullets: [
      "Automated ML pipeline with Azure DevOps, Kubernetes, Docker, and Celery",
      "Built inference APIs with FastAPI; integrated OCR + ML models",
      "Managed PostgreSQL + Redis for data storage and caching",
    ],
    techTags: ["FastAPI", "Kubernetes", "Azure", "Docker", "PostgreSQL"],
  },
  {
    id: "rfcuny",
    company: "Research Foundation of CUNY",
    role: "Software Engineer",
    startDate: "Jan 2020",
    endDate: "Aug 2020",
    bullets: [
      "Built admin tool with Ruby on Rails serving 500+ users",
      "Automated browser testing with Selenium; reduced manual QA by 40%",
    ],
    techTags: ["Ruby on Rails", "Selenium", "PostgreSQL"],
  },
];

// ─── Education ───

export const education: Education[] = [
  {
    id: "ccny-ms",
    school: "City College of New York (CUNY)",
    degree: "MS Data Science & Engineering",
    graduationDate: "May 2023",
  },
  {
    id: "qc-bs",
    school: "Queens College (CUNY)",
    degree: "BS Computer Science, Minor in Mathematics",
    graduationDate: "May 2020",
  },
];

// ─── Certifications ───

export const certifications: Certification[] = [
  {
    id: "aws-dev",
    name: "AWS Certified Developer - Associate",
    issuer: "Amazon Web Services",
    date: "2024",
  },
];
