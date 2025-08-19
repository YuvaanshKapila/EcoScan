export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface SustainabilityItem {
  id: string;
  name: string;
  category: string;
  score: number;
  impact: "high" | "medium" | "low";
  alternatives: string[];
}

export interface ScannedItem {
  name: string;
  score: number;
  impact: "high" | "medium" | "low";
  alternatives: string[];
}

export interface ScanResult {
  id: string;
  userId: string;
  items: ScannedItem[];
  totalScore: number;
  imageUrl?: string;
  feedback?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
}

export interface OCRResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{
          x: number;
          y: number;
        }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
      pages: any[];
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}