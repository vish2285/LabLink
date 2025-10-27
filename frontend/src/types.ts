export type Professor = {
  id: number;
  name: string;
  department?: string;
  email?: string;
  research_interests?: string;
  profile_link?: string;
  personal_site?: string;
  photo_url?: string;
  skills: string[];
};

export type StudentProfile = {
  name?: string;
  email?: string;
  interests: string;
  skills?: string;
  availability?: string;
  department?: string;
};

export type MatchItem = {
  score: number;
  score_percent: number;
  why: {
    interests_hits: string[];
    skills_hits: string[];
  };
  professor: Professor;
};

export type MatchResult = Professor & { 
  score?: number;
  score_percent?: number;
  why?: {
    interests_hits: string[];
    skills_hits: string[];
  };
};


