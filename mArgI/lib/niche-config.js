export const NICHE_MODES = {
  // Technology Niches
  "hft-systems": {
    label: "High-Frequency Trading (HFT) Systems",
    prompt: "Focus exclusively on low-latency engineering, C++ optimization, kernel bypass networking, FPGA integration, and market microstructure. Disregard general web development advice. Prioritize microsecond-level performance and lock-free data structures.",
    industry: "tech",
    subIndustry: "Software Development"
  },
  "ai-infrastructure": {
    label: "AI Infrastructure & ML Ops",
    prompt: "Focus on distributed training, GPU cluster management (Kubernetes/Slurm), CUDA optimization, and model serving at scale. Prioritize throughput, reduced inference latency, and hardware utilization.",
    industry: "tech",
    subIndustry: "Artificial Intelligence/Machine Learning"
  },
  "distributed-systems": {
    label: "Large-Scale Distributed Systems",
    prompt: "Focus on CAP theorem trade-offs, consensus algorithms (Raft/Paxos), eventual consistency patterns, and fault tolerance at petabyte scale. Prioritize system resilience and horizontal scalability.",
    industry: "tech",
    subIndustry: "Cloud Computing"
  },
  "blockchain-protocol": {
    label: "L1/L2 Blockchain Protocol Engineering",
    prompt: "Focus on cryptography (ZK-SNARKs, Merkle trees), consensus mechanisms (PoS/PoW), EVM bytecode optimization, and p2p networking. Prioritize gas optimization and security against reentrancy/front-running.",
    industry: "tech",
    subIndustry: "Blockchain & Cryptocurrency"
  },
  
  // Finance Niches
  "quant-research": {
    label: "Quantitative Research",
    prompt: "Focus on stochastic calculus, time-series analysis, alpha generation, and backtesting frameworks. Prioritize statistical significance and risk-adjusted returns (Sharpe ratio).",
    industry: "finance",
    subIndustry: "Investment Banking"
  },
  "private-equity": {
    label: "Private Equity & LBOs",
    prompt: "Focus on financial modeling, LBO analysis, due diligence, and deal structuring. Prioritize EBITDA expansion strategies, multiple arbitrage, and exit scenarios.",
    industry: "finance",
    subIndustry: "Private Equity"
  },
  
  // Marketing/Sales
  "deeptech-sales": {
    label: "DeepTech Enterprise Sales",
    prompt: "Focus on complex sales cycles, seeking technical buy-in from CTOs/CISO, and value-based selling of unproven technologies. Prioritize ROI modeling and pilot-to-production conversion.",
    industry: "consulting",
    subIndustry: "Strategy Consulting"
  },
  "growth-hacking": {
    label: "Product-Led Growth (PLG)",
    prompt: "Focus on viral loops, A/B testing, cohort analysis, and funnel optimization. Prioritize CAC/LTV ratios and retention metrics over brand awareness.",
    industry: "media",
    subIndustry: "Digital Marketing"
  },

  // Manufacturing Niches
  "smart-factory": {
    label: "Smart Factory & IIoT",
    prompt: "Focus on Industry 4.0, Industrial Internet of Things (IIoT), predictive maintenance models, and SCADA security. Prioritize OEE stabilization and digital twin implementation.",
    industry: "manufacturing",
    subIndustry: "Industrial Manufacturing"
  },
  "ev-powertrain": {
    label: "Electric Vehicle (EV) Powertrain",
    prompt: "Focus on battery management systems (BMS), motor control algorithms, and power electronics. Prioritize energy density and thermal management.",
    industry: "manufacturing",
    subIndustry: "Automotive"
  },

  // Healthcare Niches
  "gene-editing": {
    label: "CRISPR & Gene Editing",
    prompt: "Focus on CRISPR-Cas9 technicalities, off-target analysis, and viral vector delivery. Prioritize genomic stability and therapeutic efficacy.",
    industry: "healthcare",
    subIndustry: "Biotechnology"
  },
  "healthcare-interop": {
    label: "Healthcare Interoperability (HL7/FHIR)",
    prompt: "Focus on FHIR resources, HL7 v2 mapping, and SMART on FHIR security. Prioritize data liquidity across EHR systems.",
    industry: "healthcare",
    subIndustry: "Healthcare IT"
  }
};

export const getNichePrompt = (specializationKey) => {
  if (!specializationKey || !NICHE_MODES[specializationKey]) return "";
  return NICHE_MODES[specializationKey].prompt;
};

export const getNichesForIndustry = (industryId, subIndustry) => {
  if (!industryId || !subIndustry) return [];
  
  return Object.entries(NICHE_MODES)
    .filter(([key, config]) => 
       config.industry === industryId && 
       config.subIndustry === subIndustry
    )
    .map(([key, config]) => ({ id: key, label: config.label }));
};
