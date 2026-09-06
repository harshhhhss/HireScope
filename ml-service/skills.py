"""
A small, hand-written skills taxonomy.

Each entry maps a "canonical" skill name (the exact string we return to the
caller) to the list of aliases we look for inside the raw text. Keeping the
aliases separate from the canonical name means "js", "javascript" and
"ecmascript" all collapse into the single skill "JavaScript", so the API never
returns three different names for the same thing.
"""

SKILL_TAXONOMY = {
    # ---- Programming languages ----
    "Python": ["python"],
    "JavaScript": ["javascript", "js"],
    "TypeScript": ["typescript"],
    "Java": ["java"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp"],
    "Go": ["golang", "go lang"],
    "Rust": ["rust"],
    "Ruby": ["ruby"],
    "PHP": ["php"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "SQL": ["sql"],

    # ---- Frontend ----
    "React": ["react", "reactjs"],
    "Angular": ["angular", "angularjs"],
    "Vue": ["vue", "vuejs"],
    "Next.js": ["next.js", "nextjs"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Tailwind CSS": ["tailwind", "tailwindcss"],
    "Redux": ["redux"],

    # ---- Backend ----
    "Node.js": ["node.js", "nodejs", "node"],
    "Express": ["express", "expressjs"],
    "Django": ["django"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Spring Boot": ["spring boot", "springboot"],
    "GraphQL": ["graphql"],
    "REST API": ["rest api", "rest apis", "restful"],
    "Microservices": ["microservices", "microservice"],

    # ---- Databases ----
    "MongoDB": ["mongodb", "mongo"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "Redis": ["redis"],
    "Elasticsearch": ["elasticsearch"],
    "SQLite": ["sqlite"],
    "DynamoDB": ["dynamodb"],

    # ---- Cloud & DevOps ----
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "GCP": ["gcp", "google cloud"],
    "Docker": ["docker"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Terraform": ["terraform"],
    "Jenkins": ["jenkins"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration"],
    "Linux": ["linux", "unix"],
    "Nginx": ["nginx"],

    # ---- Data & Machine Learning ----
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning"],
    "TensorFlow": ["tensorflow"],
    "PyTorch": ["pytorch", "torch"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "NLP": ["nlp", "natural language processing"],

    # ---- Tools & ways of working ----
    "Git": ["git"],
    "GitHub": ["github"],
    "Jira": ["jira"],
    "Agile": ["agile", "scrum"],
    "Kafka": ["kafka"],
}
