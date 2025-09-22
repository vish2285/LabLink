export type Professor = {
  id?: string;
  name: string;
  department?: string;
  interests?: string[];
  publications?: string[];
  email?: string;
};

export type StudentProfile = {
  interests: string[];
  skills?: string[];
  availability?: string;
};

export type MatchResult = Professor & { score?: number };


