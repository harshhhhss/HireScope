"""
Canonical role profiles, used to answer "which roles does my resume fit?".

Each entry is data, not code. Adding a role means appending one dict here and
restarting the service - there is no per-role logic anywhere, and nothing else
needs to change.

Why the descriptions read like job postings: the score is cosine similarity
between a resume embedding and a profile embedding, exactly the same maths the
single-JD match already runs. For that comparison to mean anything, a profile
has to be written the way a real posting is - naming concrete tools, describing
day-to-day work in the same register - rather than as an abstract definition of
the discipline. A profile that reads like a textbook entry would score badly
against every real resume, and the ranking would say more about writing style
than about fit.

They live here in ml-service rather than in server/ because this is the process
that embeds and caches them at startup. Keeping them beside the model means the
two services stay independently deployable, with no shared filesystem between
them.

This is a starting set, deliberately not exhaustive.
"""

ROLE_PROFILES = [
    # ---------------- CSE ----------------
    {
        "id": "sde-backend",
        "title": "SDE / Backend Engineer",
        "branch": "CSE",
        "description": (
            "Design, build and maintain server-side applications and REST APIs that "
            "serve web and mobile clients. Write production code in Java, Python, Go "
            "or Node.js, and model data in relational databases such as PostgreSQL "
            "and MySQL as well as document stores like MongoDB. Implement "
            "authentication, caching with Redis, background job processing and "
            "message queues such as Kafka or RabbitMQ. Work with microservices, "
            "containerise applications with Docker, and deploy to cloud platforms "
            "including AWS. Write unit and integration tests, review pull requests, "
            "profile and optimise slow queries, and debug production incidents. "
            "Strong grounding in data structures, algorithms, system design, "
            "concurrency and version control with Git. Collaborate with frontend and "
            "product teams in an Agile environment."
        ),
    },
    {
        "id": "frontend-fullstack",
        "title": "Frontend / Full-Stack Engineer",
        "branch": "CSE",
        "description": (
            "Build responsive, accessible user interfaces with JavaScript and "
            "TypeScript using React, Next.js, Vue or Angular. Manage client state "
            "with Redux or similar, style interfaces with CSS, Tailwind CSS or "
            "styled-components, and consume REST and GraphQL APIs. Care about "
            "performance, bundle size, cross-browser behaviour and semantic HTML. "
            "Write component tests and work from Figma designs. On the full-stack "
            "side, build the Node.js and Express services behind those interfaces, "
            "model data in MongoDB or PostgreSQL, and handle authentication and "
            "server-side rendering. Use Git, participate in code review, and ship "
            "through CI/CD pipelines. Comfortable owning a feature end to end from "
            "database schema through to the rendered page."
        ),
    },
    {
        "id": "ai-ml-engineer",
        "title": "AI / ML Engineer",
        "branch": "CSE",
        "description": (
            "Build and deploy machine learning models for classification, "
            "regression, recommendation and natural language processing. Work in "
            "Python with PyTorch, TensorFlow and scikit-learn, and handle data with "
            "Pandas and NumPy. Engineer features, train and evaluate models, tune "
            "hyperparameters, and reason about overfitting, validation strategy and "
            "evaluation metrics. Work with transformers, embeddings and large "
            "language models, including fine-tuning and prompt design. Take models "
            "to production: build inference APIs, containerise with Docker, monitor "
            "for drift and manage experiment tracking. Familiar with deep learning "
            "architectures such as CNNs and RNNs, computer vision, and MLOps "
            "practice. Strong mathematical grounding in linear algebra, probability "
            "and statistics."
        ),
    },
    {
        "id": "data-analyst-scientist",
        "title": "Data Analyst / Data Scientist",
        "branch": "CSE",
        "description": (
            "Turn raw data into decisions. Write SQL to query warehouses, build "
            "analyses in Python with Pandas and NumPy or in R, and present findings "
            "through dashboards in Tableau, Power BI or Looker. Design and interpret "
            "A/B tests, apply statistical inference and hypothesis testing, and build "
            "forecasting and segmentation models. Clean and reconcile messy data from "
            "multiple sources, define metrics, and build ETL pipelines that keep "
            "reporting current. Communicate results to non-technical stakeholders "
            "with clear visualisation and written narrative. Comfortable with Excel "
            "for quick analysis, Git for version control, and cloud data platforms "
            "such as BigQuery, Snowflake or Redshift. Curious, sceptical about "
            "correlations, and precise about what a number does and does not show."
        ),
    },
    {
        "id": "devops-cloud",
        "title": "DevOps / Cloud Engineer",
        "branch": "CSE",
        "description": (
            "Own the infrastructure and delivery pipeline that production software "
            "runs on. Build and maintain CI/CD pipelines with Jenkins, GitHub Actions "
            "or GitLab CI. Containerise services with Docker and orchestrate them "
            "with Kubernetes. Manage cloud infrastructure on AWS, Azure or GCP, "
            "defined as code with Terraform, CloudFormation or Ansible. Administer "
            "Linux servers, configure Nginx, manage networking, DNS and TLS "
            "certificates. Implement monitoring, logging and alerting with Prometheus, "
            "Grafana or the ELK stack, and respond to production incidents. Automate "
            "repetitive operations with shell and Python scripting. Apply security "
            "hardening, manage secrets, and control cloud cost. Work closely with "
            "engineering teams to shorten the path from commit to deploy."
        ),
    },

    # ---------------- ECE ----------------
    {
        "id": "embedded-systems",
        "title": "Embedded Systems Engineer",
        "branch": "ECE",
        "description": (
            "Develop firmware for microcontrollers and embedded platforms in C and "
            "C++. Work with ARM Cortex, STM32, ESP32, Arduino and Raspberry Pi, "
            "programming peripherals over UART, SPI, I2C, CAN and GPIO. Write "
            "interrupt handlers and device drivers, and build applications on a real "
            "time operating system such as FreeRTOS. Debug with oscilloscopes, logic "
            "analysers and JTAG, and read datasheets and schematics closely. Optimise "
            "for constrained memory, deterministic timing and low power consumption. "
            "Integrate sensors and actuators for IoT and robotics applications, and "
            "handle wireless communication over BLE, Wi-Fi or LoRa. Comfortable with "
            "hardware-software co-design, board bring-up, and validating firmware "
            "against real electrical behaviour rather than simulation alone."
        ),
    },
    {
        "id": "vlsi-chip-design",
        "title": "VLSI / Chip Design Engineer",
        "branch": "ECE",
        "description": (
            "Design and verify digital integrated circuits. Write RTL in Verilog, "
            "SystemVerilog or VHDL, and build testbenches using UVM for functional "
            "verification. Work through the ASIC and FPGA flow: synthesis, static "
            "timing analysis, place and route, clock domain crossing, and design for "
            "testability. Use industry tools from Cadence, Synopsys and Mentor, "
            "including Design Compiler, PrimeTime and ModelSim. Understand digital "
            "logic design, computer architecture, pipelining, memory hierarchies and "
            "low-power design techniques. On the analog and physical side, work with "
            "CMOS fundamentals, layout, parasitic extraction and SPICE simulation. "
            "Debug timing violations and coverage gaps, and reason carefully about "
            "area, power and frequency trade-offs across the design."
        ),
    },
    {
        "id": "telecom-signal-processing",
        "title": "Telecommunications / Signal Processing Engineer",
        "branch": "ECE",
        "description": (
            "Work on the systems that move information over physical channels. Apply "
            "digital signal processing: filtering, Fourier and wavelet transforms, "
            "sampling, modulation and demodulation schemes, and error correcting "
            "codes. Model and simulate communication systems in MATLAB, Simulink and "
            "Python, and implement algorithms on DSP processors or FPGAs. Understand "
            "wireless standards including 4G LTE and 5G NR, OFDM, MIMO, channel "
            "estimation and equalisation. Work with RF fundamentals, antennas, link "
            "budgets, and network protocols across the stack. Analyse signal integrity "
            "and noise, and validate designs against measured spectrum rather than "
            "theory alone. Strong grounding in probability, random processes, "
            "information theory and linear systems."
        ),
    },

    # ---------------- EEE ----------------
    {
        "id": "electrical-power-systems",
        "title": "Electrical / Power Systems Engineer",
        "branch": "EEE",
        "description": (
            "Design, analyse and maintain electrical power systems from generation "
            "through transmission and distribution. Perform load flow, short circuit "
            "and stability studies using ETAP, PSCAD or MATLAB. Size and specify "
            "transformers, switchgear, cables, busbars and protective relays, and "
            "design coordination and earthing schemes. Read and produce single line "
            "diagrams and electrical schematics in AutoCAD. Work with substations, "
            "high and low voltage equipment, power quality, harmonics and power "
            "factor correction. Apply standards such as IEC and IEEE, and carry out "
            "testing, commissioning and fault analysis on site. Increasingly involved "
            "in renewable integration including solar PV and wind, energy storage, "
            "SCADA systems and smart grid instrumentation."
        ),
    },
    {
        "id": "control-power-electronics",
        "title": "Control Systems / Power Electronics Engineer",
        "branch": "EEE",
        "description": (
            "Design control systems and power conversion circuits. Model plants and "
            "design controllers using PID, state-space and frequency-domain methods, "
            "simulating in MATLAB and Simulink. Implement control loops on "
            "microcontrollers and DSPs in embedded C. Design and analyse power "
            "electronic converters including buck, boost, inverters and rectifiers, "
            "with attention to switching losses, thermal management, magnetics and "
            "EMI. Work on motor drives, BLDC and induction motor control, and battery "
            "management systems for electric vehicles and renewable energy. Use "
            "PLCs, SCADA and industrial automation where the application calls for "
            "it. Validate designs on hardware with oscilloscopes and power analysers, "
            "and reason about stability, transient response and efficiency."
        ),
    },

    # ---------------- Mechanical ----------------
    {
        "id": "design-engineer-cad",
        "title": "Design Engineer (CAD)",
        "branch": "Mechanical",
        "description": (
            "Take mechanical products from concept through to manufacturable design. "
            "Model parts and assemblies in SolidWorks, CATIA, Creo, AutoCAD or "
            "Fusion 360, and produce detailed drawings with correct tolerancing and "
            "GD&T. Apply engineering mechanics, strength of materials, machine design "
            "and materials selection. Run finite element analysis in ANSYS or "
            "SolidWorks Simulation to validate stress, deflection and fatigue, and "
            "CFD where flow matters. Design for manufacturability and assembly, "
            "accounting for casting, machining, sheet metal and injection moulding "
            "constraints. Build and test prototypes, including 3D printing, and "
            "iterate from measured results. Maintain BOMs and revision control, and "
            "work with suppliers and manufacturing teams to get a design built."
        ),
    },
    {
        "id": "manufacturing-production",
        "title": "Manufacturing / Production Engineer",
        "branch": "Mechanical",
        "description": (
            "Run and improve the processes that turn designs into products. Plan "
            "production, balance lines, and improve throughput, yield and cycle time "
            "on the shop floor. Apply lean manufacturing, Six Sigma, 5S, kaizen and "
            "root cause analysis to reduce waste and defects. Work with CNC "
            "machining, welding, casting, forming and assembly processes, and specify "
            "tooling, jigs and fixtures. Own quality: SPC, inspection plans, "
            "metrology, ISO 9001 documentation and corrective actions. Use ERP "
            "systems such as SAP for material planning and inventory, and interpret "
            "production data to find bottlenecks. Coordinate maintenance, uphold "
            "safety standards, and work directly with operators, suppliers and "
            "quality teams to keep a line running."
        ),
    },
    {
        "id": "automotive-engineer",
        "title": "Automotive Engineer",
        "branch": "Mechanical",
        "description": (
            "Develop vehicle systems and components, from concept through validation. "
            "Work on powertrain, chassis, suspension, braking, transmission or body "
            "systems, and increasingly on electric vehicle architecture including "
            "battery packs, thermal management and motor integration. Model in CATIA "
            "or SolidWorks, simulate with ANSYS and analyse vehicle dynamics. "
            "Understand internal combustion engines, emissions and fuel systems "
            "alongside EV drivetrains. Work with automotive electronics, CAN bus "
            "communication and embedded control units. Apply standards and testing "
            "regimes including durability, NVH, crash safety and homologation. Use "
            "APQP, FMEA and PPAP within a supplier-driven development process, and "
            "validate designs on test rigs and vehicles rather than in simulation "
            "alone."
        ),
    },

    # ---------------- Non-core: common outcomes regardless of branch ----------------
    {
        "id": "it-services-consulting",
        "title": "IT Services / Consulting Generalist",
        "branch": "Non-core",
        "description": (
            "Implement and support enterprise applications for client organisations "
            "under fixed-scope SOW and SLA commitments. Configure packaged platforms "
            "- SAP ABAP with FICO or MM modules, Salesforce Apex, Lightning "
            "components and flows, ServiceNow ITSM workflows - and integrate them "
            "over REST and SOAP APIs, middleware and batch ETL jobs. Maintain a "
            "requirement traceability matrix, run SIT and regression suites in "
            "Selenium, and execute cutover and data-migration runbooks. Handle L2 "
            "and L3 production support: triage incident tickets against ITIL "
            "incident, problem and change management, root-cause defects, and meet "
            "response SLAs. Write SQL joins and stored procedures for extracts and "
            "reconciliation. Release through Jenkins pipelines onto AWS or Azure. "
            "Coordinate onsite-offshore handover across time zones."
        ),
    },
    {
        "id": "business-analyst",
        "title": "Business Analyst",
        "branch": "Non-core",
        "description": (
            "Specify what a software change must do, in documents a developer can "
            "build from. Run stakeholder elicitation workshops, then author BRD and "
            "FRD specifications and a requirement traceability matrix, and write "
            "epics and user stories with Gherkin acceptance criteria in JIRA, "
            "keeping the specification set versioned in Confluence. Map AS-IS and "
            "TO-BE workflows in BPMN or Visio, run gap analysis, and rank scope by "
            "MoSCoW prioritisation against RACI ownership. Write SQL joins, "
            "aggregates and window functions for reporting extracts, and publish "
            "Power BI and Tableau dashboards on top of them. Own UAT: build test "
            "scripts, coordinate business testers, triage defects and sign off. "
            "Work Scrum ceremonies - backlog grooming, sprint planning, "
            "retrospectives - beside the product owner."
        ),
    },
]


# ---------------------------------------------------------------------------
# Calibration resumes
#
# These exist to answer one question: what does this profile score against an
# ordinary resume, chosen without regard to the profile?
#
# That number is not zero, and it is not the same for every profile. A tightly
# written profile like Telecom / Signal Processing scores ~0.07 against an
# unrelated resume; a broad one that name-drops SQL, cloud, Agile and several
# languages scores ~0.27 against the same resume, because it sits near
# everything in embedding space. Comparing raw cosine values across profiles
# therefore compares two different things, and the broad profile wins ties it
# has not earned.
#
# So each profile's own median across this set is measured once at startup and
# subtracted before scoring - see the note beside PROFILE_BASELINES in app.py
# for why the median and not the mean.
#
# The set holds one resume per discipline on purpose. If it leaned towards CSE,
# every CSE profile would inherit an inflated baseline and get unfairly
# penalised. Six is enough to separate "broad" from "narrow" - a generic
# profile scores about the same against all of them, a specific one peaks on
# exactly one - and small enough to embed in well under a second.
#
# These are written samples, not real resumes - nobody's data is in here.
# ---------------------------------------------------------------------------

BASELINE_RESUMES = [
    # CSE - backend
    "Backend engineer. Built REST APIs in Python with Flask and FastAPI serving "
    "40k requests a day. MongoDB for document storage, Redis for caching hot "
    "queries. Containerised services with Docker and deployed on AWS EC2. "
    "Node.js and Express microservices, PostgreSQL schema design and query "
    "optimisation. Unit tests and Git-based code review. Skills: Python, "
    "JavaScript, Node.js, MongoDB, PostgreSQL, Docker, AWS, Git.",

    # CSE - data / ML
    "Data science intern. Cleaned and analysed datasets with pandas and numpy, "
    "built regression and classification models in scikit-learn, and tuned a "
    "PyTorch neural network for text classification. Wrote SQL queries against "
    "a warehouse and built Tableau dashboards for weekly reporting. Evaluated "
    "models with precision, recall and AUC. Skills: Python, SQL, pandas, "
    "scikit-learn, PyTorch, Tableau, statistics.",

    # ECE - embedded
    "Embedded systems engineer. Wrote firmware in Embedded C for STM32 and "
    "ARM Cortex-M microcontrollers. Configured UART, SPI and I2C peripherals, "
    "debugged with an oscilloscope and JTAG, and worked with FreeRTOS tasks "
    "and interrupts. Designed schematics in Altium and brought up custom PCBs. "
    "Skills: C, C++, STM32, RTOS, SPI, I2C, CAN, PCB design.",

    # EEE - power
    "Electrical engineer. Worked on 11kV distribution substation design, load "
    "flow and short-circuit studies in ETAP, and protection relay coordination. "
    "Prepared single-line diagrams in AutoCAD, sized transformers and cables to "
    "IS and IEC standards, and supported site testing and commissioning. "
    "Skills: ETAP, AutoCAD, switchgear, protection, power systems.",

    # Mechanical
    "Mechanical design engineer. Modelled parts and assemblies in SolidWorks "
    "and CATIA, produced GD&T drawings, and ran structural FEA in ANSYS to "
    "validate designs. Selected materials, applied DFM and tolerance stack-up "
    "analysis, and coordinated with vendors on sheet metal and machined "
    "components. Skills: SolidWorks, CATIA, ANSYS, GD&T, FEA, DFM.",

    # Non-core / general graduate
    "B.Tech graduate seeking a role in technology. Coursework in programming, "
    "databases and operating systems. Built a college event management website "
    "and a small inventory tracker as academic projects. Certifications in "
    "Python and cloud fundamentals. Organised a technical fest and led a team "
    "of six volunteers. Strong communication, teamwork and willingness to "
    "learn new tools quickly.",
]
