export const INITIAL_FILES = [
  {
    id: 'f-1',
    name: 'Q3_Financial_Analysis.csv',
    type: 'csv',
    size: '1.4 MB',
    tokens: 18450,
    status: 'indexed',
    folder: 'Finance & Strategy',
    updatedAt: '2026-10-10 14:32',
    author: 'Damien K.',
    summary: 'Quarterly breakdown of MRR, customer acquisition cost (CAC), LTV ratios, and cloud infrastructure expenses across AWS and GCP.',
    content: `Month,MRR,New_Users,CAC,LTV,Cloud_Infrastructure_Cost,Gross_Margin
July,420000,1420,185,14200,68400,78.4%
August,485000,1650,172,15100,71200,79.1%
September,550000,1980,164,16200,74900,80.5%
Quarter_Total,1455000,5050,173.6,15166,214500,79.3%
Key Insight: Enterprise plan tier increased by 38% MoM; GPU inference unit costs decreased by 14% due to dynamic quantization.`,
    tags: ['Finance', 'Q3', 'Metrics', 'Revenue'],
    connectedSpaces: ['space-1', 'space-3'],
  },
  {
    id: 'f-2',
    name: 'Agentic_Workflow_Architecture_v2.md',
    type: 'markdown',
    size: '480 KB',
    tokens: 9240,
    status: 'indexed',
    folder: 'Engineering & AI',
    updatedAt: '2026-10-11 11:15',
    author: 'Damien K.',
    summary: 'Technical specification for autonomous multi-agent orchestration, streaming tool executions, and stateful memory synchronization.',
    content: `# Agentic Workflow Architecture v2.0

## 1. Executive Overview
Our platform leverages an event-driven orchestrator where multiple domain-specialized agents (Researcher, Code Reviewer, Summarizer) communicate across a shared blackboard memory architecture.

## 2. Memory Bus & Grounding
- **Vector Indexing**: Instant semantic indexing of workspace documents upon upload using Google Gecko/Gemini embeddings.
- **Context Mounting**: Chat spaces selectively mount files. Mounted files are partitioned into sliding semantic windows based on user query intent.
- **Access Boundaries**: Agents inherit strict read-only execution sandboxes unless explicit approval tokens are granted.

## 3. Real-Time Collaboration
- WebSockets provide live multi-user streaming.
- Human users and AI agents participate as peer entities in the message thread.
- Citations format: [Filename: Chunk_ID] with clickable inspect hooks.`,
    tags: ['Architecture', 'Agents', 'System Design'],
    connectedSpaces: ['space-1', 'space-2'],
  },
  {
    id: 'f-3',
    name: 'Customer_Interview_Insights_2026.docx',
    type: 'doc',
    size: '2.1 MB',
    tokens: 24300,
    status: 'indexed',
    folder: 'Product Research',
    updatedAt: '2026-10-09 16:40',
    author: 'Damien K.',
    summary: 'Consolidated notes from 34 enterprise customer interviews detailing team pain points around siloed AI tools and fragmented prompt knowledge.',
    content: `Enterprise Customer Research Synthesis (N=34 Companies)

1. The "Isolated Chat Tab" Problem:
   - 94% of teams surveyed stated that individual team members upload company documents into isolated personal ChatGPT/Claude tabs.
   - Result: Duplicated work, zero cross-functional context sharing, and no institutional memory.
   
2. The "Drive Disconnect":
   - Standard cloud storage (Google Drive, SharePoint) is a graveyard of static PDFs where AI cannot autonomously organize, cross-reference, or collaborate alongside teams.
   
3. Desired Solution:
   - A unified shared Drive where files and chat rooms are unified. When a teammate chats with an AI about an RFP, the entire team can see the thread, the source file citations, and co-prompt in real-time.`,
    tags: ['Customer Feedback', 'Product', 'Interviews'],
    connectedSpaces: ['space-1'],
  },
  {
    id: 'f-4',
    name: 'Enterprise_Master_Service_Agreement_Template.pdf',
    type: 'pdf',
    size: '890 KB',
    tokens: 14600,
    status: 'indexed',
    folder: 'Legal & Compliance',
    updatedAt: '2026-10-08 09:20',
    author: 'Damien K.',
    summary: 'Standard SaaS enterprise agreement containing indemnification clauses, SLA tiers (99.95%), and GDPR/SOC2 compliance obligations.',
    content: `MASTER SERVICE AGREEMENT (MSA) - ENTERPRISE EDITION

SECTION 4: DATA PRIVACY & AI TRAINING EXCLUSION
4.1 Customer Data Ownership: Customer retains all rights, title, and interest in and to Customer Data.
4.2 AI Model Training Prohibition: Vendor strictly covenants that Customer Data (including prompts, queries, and uploaded workspace files) shall NEVER be utilized to train, retrain, or fine-tune public foundation models.
4.3 Zero Retention Guarantee: Ephemeral inference caches are cleared immediately upon session termination unless persisted explicitly by Customer in CogniDrive.`,
    tags: ['Legal', 'MSA', 'Security', 'Compliance'],
    connectedSpaces: ['space-3'],
  },
  {
    id: 'f-5',
    name: 'Competitor_Landscape_Analysis.md',
    type: 'markdown',
    size: '340 KB',
    tokens: 6800,
    status: 'indexed',
    folder: 'Product Research',
    updatedAt: '2026-10-11 08:05',
    author: 'Damien K.',
    summary: 'Competitive analysis comparing NotebookLM, Slack AI, Notion AI, Microsoft Copilot Pages, and ChatGPT Team workspaces.',
    content: `Market Comparison Matrix:

1. NotebookLM (Google):
   - Pros: Exceptional audio overviews, source grounding.
   - Cons: Purely single-player or read-only note sharing; no multi-model routing; no file generation into Drive; no live team chat channels.

2. Slack AI:
   - Pros: Great chat integration.
   - Cons: Lacks hierarchical document drive; poor deep-document RAG navigation; cannot mount large multi-format files selectively.

3. Notion AI:
   - Pros: Rich documents.
   - Cons: Not built as a file-first Drive; restricted to internal Notion pages; proprietary markup.

4. CogniDrive (Our Opportunity):
   - The unified file system for team-wide conversational intelligence. Store any file format, spin up collaborative multi-agent rooms, mount files dynamically with real-time token budgeting, and write AI outputs back to Drive as versioned files.`,
    tags: ['Strategy', 'Competitors', 'Market Analysis'],
    connectedSpaces: ['space-1'],
  },
  {
    id: 'f-6',
    name: 'Synthetic_Data_Generator.py',
    type: 'code',
    size: '120 KB',
    tokens: 3100,
    status: 'indexed',
    folder: 'Engineering & AI',
    updatedAt: '2026-10-10 18:00',
    author: 'Damien K.',
    summary: 'Python utility script leveraging Gemini 3.8 Flash to synthesize realistic edge-case dialogue trajectories and validation suites.',
    content: `import json
import asyncio
from typing import List, Dict

class SyntheticTrajectoryGenerator:
    """Generates multi-turn user/AI conversation traces grounded in connected Drive files."""
    def __init__(self, model_name: str = "gemini-3.8-flash"):
        self.model_name = model_name
        self.context_window = 1_000_000

    async def generate_grounded_exchange(self, source_docs: List[Dict]) -> Dict:
        # Grounding pipeline simulation
        citations = [doc['name'] for doc in source_docs]
        return {
            "query": "Synthesize key risks from mounted compliance docs",
            "grounded_sources": citations,
            "status": "success"
        }
`,
    tags: ['Python', 'Code', 'Synthetic Data'],
    connectedSpaces: ['space-2'],
  }
];

export const INITIAL_FOLDERS = [
  { id: 'fol-1', name: 'Finance & Strategy', color: '#1a73e8', fileCount: 1 },
  { id: 'fol-2', name: 'Engineering & AI', color: '#1a73e8', fileCount: 2 },
  { id: 'fol-3', name: 'Product Research', color: '#1a73e8', fileCount: 2 },
  { id: 'fol-4', name: 'Legal & Compliance', color: '#1a73e8', fileCount: 1 },
];

export const AI_BOTS = [
  {
    id: 'bot-gemini',
    name: 'Gemini 3.8 Flash',
    provider: 'Google DeepMind',
    role: 'Fast Synthesis & Large Context (1M tokens)',
    avatar: '⚡',
    color: '#1a73e8',
    badge: '1M Context',
  },
  {
    id: 'bot-claude',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    role: 'Reasoning & Nuanced Document Analysis',
    avatar: '🧠',
    color: '#5f6368',
    badge: 'Deep Reasoning',
  },
  {
    id: 'bot-coder',
    name: 'Code Synthesizer AI',
    provider: 'Specialized Agent',
    role: 'Codebase Inspection & Test Generation',
    avatar: '💻',
    color: '#5f6368',
    badge: 'Code Engine',
  },
  {
    id: 'bot-legal',
    name: 'Compliance & Audit Bot',
    provider: 'Specialized Agent',
    role: 'Contract Review & Regulatory Checking',
    avatar: '⚖️',
    color: '#5f6368',
    badge: 'Audit & Compliance',
  }
];

export const TEAM_MEMBERS = [
  { id: 'u-1', name: 'Damien K.', role: 'Owner', avatar: 'DK', online: true, status: 'Active' }
];

export const INITIAL_SPACES = [
  {
    id: 'space-1',
    name: 'Q3 Product & Growth Strategy',
    description: 'Workspace room to analyze customer interviews, Q3 financial margins, and market positioning.',
    activeBots: ['bot-gemini', 'bot-claude'],
    members: ['u-1'],
    connectedFileIds: ['f-1', 'f-3', 'f-5'],
    messages: [
      {
        id: 'm-1',
        senderType: 'human',
        author: 'Damien K.',
        avatar: 'DK',
        timestamp: '11:20 AM',
        content: "I connected the customer interview synthesis (`Customer_Interview_Insights_2026.docx`) and competitor matrix to this space. @Gemini 3.8 Flash, can you contrast what enterprise customers are complaining about with our Q3 margin performance?",
      },
      {
        id: 'm-2',
        senderType: 'ai',
        botId: 'bot-gemini',
        author: 'Gemini 3.8 Flash',
        avatar: '⚡',
        timestamp: '11:21 AM',
        reasoningTime: '1.2s',
        content: `I've analyzed both **Customer_Interview_Insights_2026.docx** and **Q3_Financial_Analysis.csv**. Here is the core strategic intersection:

### 1. The Core Customer Pain Point
* **94% of enterprise teams** report that employees are dumping confidential enterprise files into disconnected personal AI chat tabs, causing zero team reuse and high compliance friction.
* They specifically demand a shared repository where chat threads and mounted files live side-by-side.

### 2. Financial Alignment
* In **Q3_Financial_Analysis.csv**, your Enterprise Tier grew **38% MoM** with Gross Margins reaching **80.5% in September**.
* Notably, GPU inference unit costs decreased by **14%** due to dynamic quantization.

### Strategic Recommendation:
Position **CogniDrive** directly as the "Enterprise-Grade Collaborative Memory" for teams. By bundling shared team drives with multi-model chat channels, you solve the #1 enterprise security complaint while defending your 80%+ margin structure.`,
        citations: [
          { fileId: 'f-3', fileName: 'Customer_Interview_Insights_2026.docx', excerpt: '94% of teams surveyed stated that individual team members upload company documents into isolated personal tabs...' },
          { fileId: 'f-1', fileName: 'Q3_Financial_Analysis.csv', excerpt: 'September MRR $550k, Gross Margin 80.5%, Enterprise tier increased 38% MoM' }
        ],
        hasArtifact: true,
        artifactData: {
          title: 'Executive_Growth_Brief_Q3.md',
          preview: 'Actionable executive synthesis combining interview friction points with margin defensibility...'
        }
      },
      {
        id: 'm-3',
        senderType: 'human',
        author: 'Damien K.',
        avatar: 'DK',
        timestamp: '11:25 AM',
        content: "Does the current customer research mention anything about multi-model preferences (e.g. using Claude vs Gemini for different tasks)?",
      },
      {
        id: 'm-4',
        senderType: 'ai',
        botId: 'bot-claude',
        author: 'Claude 3.7 Sonnet',
        avatar: '🧠',
        timestamp: '11:26 AM',
        reasoningTime: '2.4s',
        content: `Looking at **Competitor_Landscape_Analysis.md** and the interview logs:

Enterprises strongly reject single-model lock-in:
1. **Gemini** is preferred for high-volume document ingest, massive context windows (up to 1M+ tokens), and rapid data synthesis.
2. **Claude** is favored by product and legal teams for deep logical contract review, policy formulation, and nuanced drafting.
3. **Dedicated Code Models** are needed for automated schema validation.

Having a shared space where team members can invoke **different models on the same mounted drive files** in the exact same chat thread is cited as a major gap in ChatGPT Team and NotebookLM.`,
        citations: [
          { fileId: 'f-5', fileName: 'Competitor_Landscape_Analysis.md', excerpt: 'NotebookLM lacks multi-model routing; ChatGPT lacks file-first hierarchical Drive...' }
        ]
      }
    ]
  },
  {
    id: 'space-2',
    name: 'AI Agent Architecture & Spec',
    description: 'Technical evaluation of multi-agent streaming and vector memory sync.',
    activeBots: ['bot-coder', 'bot-gemini'],
    members: ['u-1'],
    connectedFileIds: ['f-2', 'f-6'],
    messages: [
      {
        id: 'm-201',
        senderType: 'human',
        author: 'Damien K.',
        avatar: 'DK',
        timestamp: 'Yesterday',
        content: "Inspect `Synthetic_Data_Generator.py` against `Agentic_Workflow_Architecture_v2.md`. Are our streaming tool hooks compliant?",
      },
      {
        id: 'm-202',
        senderType: 'ai',
        botId: 'bot-coder',
        author: 'Code Synthesizer AI',
        avatar: '💻',
        timestamp: 'Yesterday',
        reasoningTime: '1.8s',
        content: `Reviewed both files:
The Python generator in \`Synthetic_Data_Generator.py\` currently returns static mock payloads. In section 2 of \`Agentic_Workflow_Architecture_v2.md\`, we specified event-driven streaming with strict access boundary validation.

**Suggested update:** Implement async chunk generators with token usage telemetry headers to match the v2 architecture spec.`,
        citations: [
          { fileId: 'f-2', fileName: 'Agentic_Workflow_Architecture_v2.md', excerpt: 'Section 2: Agents inherit strict read-only execution sandboxes...' },
          { fileId: 'f-6', fileName: 'Synthetic_Data_Generator.py', excerpt: 'async def generate_grounded_exchange(self, source_docs)...' }
        ]
      }
    ]
  },
  {
    id: 'space-3',
    name: 'Legal & Compliance Audit',
    description: 'Reviewing enterprise MSA terms, zero data retention, and HIPAA/SOC2 covenants.',
    activeBots: ['bot-legal', 'bot-claude'],
    members: ['u-1'],
    connectedFileIds: ['f-1', 'f-4'],
    messages: [
      {
        id: 'm-301',
        senderType: 'human',
        author: 'Damien K.',
        avatar: 'DK',
        timestamp: 'Oct 8',
        content: "Does Section 4 of our MSA template guarantee that customer drive files won't be used to train external LLMs?",
      },
      {
        id: 'm-302',
        senderType: 'ai',
        botId: 'bot-legal',
        author: 'Compliance & Audit Bot',
        avatar: '⚖️',
        timestamp: 'Oct 8',
        reasoningTime: '0.9s',
        content: `Yes, explicitly. In **Enterprise_Master_Service_Agreement_Template.pdf**, Section 4.2 states:
> *"Vendor strictly covenants that Customer Data (including prompts, queries, and uploaded workspace files) shall NEVER be utilized to train, retrain, or fine-tune public foundation models."*

Additionally, Section 4.3 guarantees zero retention on ephemeral inference caches.`,
        citations: [
          { fileId: 'f-4', fileName: 'Enterprise_Master_Service_Agreement_Template.pdf', excerpt: 'Section 4.2 AI Model Training Prohibition...' }
        ]
      }
    ]
  }
];
