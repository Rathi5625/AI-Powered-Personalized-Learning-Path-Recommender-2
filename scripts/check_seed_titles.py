import csv, glob, os

seed_titles = {
    'Java Programming Masterclass 21',
    'Building Scalable REST APIs with Spring Boot 3',
    'Docker & Containerization for Java Developers',
    'Cloud-Native Microservices Architecture',
    'Kubernetes Cluster Orchestration & Deployment',
    'Modern React & TypeScript Full Stack Engineering',
    'Data Structures & Algorithmic Thinking',
    'High-Scale Distributed System Design'
}

matches = []
for f in sorted(glob.glob('backend/src/main/resources/data/*.csv')):
    with open(f, encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            title = row.get('title', '').strip()
            if title in seed_titles:
                matches.append((os.path.basename(f), title, row.get('course_id', '')))

if matches:
    for m in matches:
        print(f'FILE: {m[0]:25s}  title={m[1]}  course_id={m[2]}')
else:
    print('No seed titles found in any CSV file.')
    print('=> 8 legacy seeds are EXCLUSIVE to V3__seed_courses.sql, not in CSVs.')
