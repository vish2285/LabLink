"""Centralized mapping of skill aliases to canonical forms.

Extend this mapping with department-specific synonyms to improve match recall.
"""

from typing import Dict

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


