from typing import Dict, List

# Centralized alias dictionaries for skills and interests.
SKILL_ALIASES: Dict[str, str] = {
    "torch": "pytorch", "pytorch": "pytorch",
    "tf": "tensorflow", "tensorflow": "tensorflow",
    "opencv": "opencv",
    "cuda": "cuda", "nvidia-cuda": "cuda",
    "cpp": "c++", "c sharp": "c#", "postgres": "postgresql",
    "hpc": "high-performance computing",
    "pl": "programming languages",
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "rl": "reinforcement learning",
    "llm": "large language model",
    "llms": "large language models",
    "vit": "vision transformer",
    "vision transformer": "vision transformer",
    "rag": "retrieval augmented generation",
    "ssl": "self-supervised learning",
}

# Light synonym/alias expansion for interest phrases (used for query expansion only)
INTEREST_ALIASES: Dict[str, List[str]] = {
    "nlp": ["natural language processing", "computational linguistics"],
    "natural language processing": ["nlp", "language models", "text processing"],
    "cv": ["computer vision", "image recognition", "visual recognition"],
    "computer vision": ["cv", "image understanding", "object detection"],
    "ml": ["machine learning"],
    "machine learning": ["ml", "statistical learning"],
    "dl": ["deep learning"],
    "deep learning": ["dl", "neural networks"],
    "rl": ["reinforcement learning"],
    "large language model": ["llm", "transformers"],
    "large language models": ["llms", "foundation models"],
    "gnn": ["graph neural networks", "graph learning"],
    "graph neural networks": ["gnn", "graph representation learning"],
    "vision transformer": ["vit", "transformer vision", "image transformer", "vit"],
    "retrieval augmented generation": ["rag", "retrieval-augmented generation"],
    "self-supervised learning": ["ssl", "contrastive learning"],
    "causal inference": ["causality", "causal discovery"],
    "bayesian inference": ["probabilistic modeling", "bayesian modeling"],
    "robotics": ["autonomous systems", "robot learning"],
    "graph representation learning": ["gnn", "graph neural networks"],
    "time series": ["temporal modeling", "sequence forecasting"],
    "optimization": ["stochastic optimization", "convex optimization"],
}


