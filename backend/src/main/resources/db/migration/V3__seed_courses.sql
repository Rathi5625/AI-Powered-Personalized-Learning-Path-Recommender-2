-- Seed Skills
INSERT INTO skills (id, name, category) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Java', 'Languages'),
  ('a0000000-0000-0000-0000-000000000002', 'Spring Boot', 'Frameworks'),
  ('a0000000-0000-0000-0000-000000000003', 'Docker', 'DevOps'),
  ('a0000000-0000-0000-0000-000000000004', 'Kubernetes', 'DevOps'),
  ('a0000000-0000-0000-0000-000000000005', 'Microservices', 'Architecture'),
  ('a0000000-0000-0000-0000-000000000006', 'PostgreSQL', 'Databases'),
  ('a0000000-0000-0000-0000-000000000007', 'React', 'Frontend'),
  ('a0000000-0000-0000-0000-000000000008', 'TypeScript', 'Languages'),
  ('a0000000-0000-0000-0000-000000000009', 'Data Structures & Algorithms', 'Core CS'),
  ('a0000000-0000-0000-0000-000000000010', 'System Design', 'Architecture')
ON CONFLICT (name) DO NOTHING;

-- Seed Courses
INSERT INTO courses (id, title, description, level, duration_hours, platform, link) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'Java Programming Masterclass 21',
    'Comprehensive foundation in modern Java 21 including OOP, Collections, Concurrency, Lambdas, and Virtual Threads.',
    'BEGINNER',
    24,
    'Coursera',
    'https://www.coursera.org/learn/java-programming'
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'Building Scalable REST APIs with Spring Boot 3',
    'Deep dive into enterprise Spring Boot 3, Spring Data JPA, Hibernate ORM, and secure stateless JWT authentication.',
    'EASY',
    18,
    'Udemy',
    'https://www.udemy.com/course/spring-boot-rest-api'
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    'Docker & Containerization for Java Developers',
    'Master multi-stage Docker builds, container optimization, environment management, and Docker Compose orchestration.',
    'EASY',
    12,
    'Udemy',
    'https://www.udemy.com/course/docker-for-java-developers'
  ),
  (
    'c0000000-0000-0000-0000-000000000004',
    'Cloud-Native Microservices Architecture',
    'Design decoupled distributed systems with API Gateways, Eureka Service Discovery, OpenFeign, Resilience4j, and Kafka event streams.',
    'MEDIUM',
    28,
    'Coursera',
    'https://www.coursera.org/learn/microservices-architecture'
  ),
  (
    'c0000000-0000-0000-0000-000000000005',
    'Kubernetes Cluster Orchestration & Deployment',
    'Deploy production workloads to Kubernetes with Pods, Deployments, Services, Ingress Controllers, ConfigMaps, and Helm charts.',
    'HIGH',
    20,
    'edX',
    'https://www.edx.org/course/kubernetes-deployment'
  ),
  (
    'c0000000-0000-0000-0000-000000000006',
    'Modern React & TypeScript Full Stack Engineering',
    'Build production web applications with React 18, TypeScript, Tailwind CSS, TanStack Query, and interactive 3D visualizations.',
    'EASY',
    22,
    'Coursera',
    'https://www.coursera.org/learn/react-typescript'
  ),
  (
    'c0000000-0000-0000-0000-000000000007',
    'Data Structures & Algorithmic Thinking',
    'Essential computer science foundations: arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming.',
    'BEGINNER',
    30,
    'edX',
    'https://www.edx.org/course/algorithms-data-structures'
  ),
  (
    'c0000000-0000-0000-0000-000000000008',
    'High-Scale Distributed System Design',
    'Architect resilient, horizontally partitioned systems handling millions of concurrent requests with caching, load balancing, and sharding.',
    'HIGH',
    25,
    'Udemy',
    'https://www.udemy.com/course/system-design'
  )
ON CONFLICT (id) DO NOTHING;

-- Course Skills Mapping
INSERT INTO course_skills (course_id, skill_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000007'),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000008'),
  ('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000009'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005'),
  ('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Course Prerequisites (Topological Graph)
-- Spring Boot requires Java
INSERT INTO course_prerequisites (course_id, prerequisite_course_id) VALUES
  ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
  -- Microservices requires Spring Boot and Docker
  ('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003'),
  -- Kubernetes requires Docker
  ('c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003'),
  -- System Design requires Microservices & DSA
  ('c0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000007')
ON CONFLICT DO NOTHING;
