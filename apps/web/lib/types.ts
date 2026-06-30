export interface VoiceProfileStatus {
  status: "not_started" | "building" | "ready" | "failed";
  confidence_level?: "low" | "medium" | "high" | "provisional";
  post_count: number;
  last_built_at?: string;
  profile_type?: "extracted" | "seed";
}

export interface VoiceStrengthResponse {
  level: "provisional" | "learning" | "established";
  profile_type: "extracted" | "seed";
  edit_count: number;
  posts_added: number;
  next_milestone: string;
}

export interface VoiceProfile {
  id: string;
  status: string;
  post_count: number;
  confidence_level?: "low" | "medium" | "high" | "provisional";
  profile_type?: "extracted" | "seed";
  hook_distribution?: Record<string, number>;
  sentence_rhythm?: {
    avg_length: number;
    short_ratio: number;
    long_ratio: number;
  };
  paragraph_structure?: {
    single_line_ratio: number;
    avg_paragraph_length: number;
  };
  vocabulary_register?: {
    formality_score: number;
    jargon_density: number;
    avg_word_length: number;
  };
  structural_pattern?: {
    dominant: string;
    frequency: number;
    alternatives: Array<{ pattern: string; frequency: number }>;
  };
  cta_style?: {
    dominant: string;
    frequency: number;
    none_ratio: number;
  };
  emotional_register?: Record<string, number>;
  last_built_at?: string;
  // Deep fingerprint (populated after migration 003)
  lexical_signature?: {
    signature_phrases?: string[];
    absent_vocabulary?: string[];
    signature_metaphors?: string[];
  } | null;
  argument_templates?: Array<{
    type: string;
    frequency: number;
    template: string;
    opening_signal: string;
  }> | null;
  belief_stances?: {
    positions?: Array<{
      topic: string;
      stance: string;
      summary: string;
      evidence_count: number;
    }>;
  } | null;
  epistemic_style?: {
    persona?: string;
    confidence_level?: number;
    self_reference_rate?: number;
    hedge_frequency?: number;
    authority_basis?: string;
  } | null;
}

export interface ApiError {
  detail: string;
}

export interface DimensionScores {
  hook_style: number;
  structural_pattern: number;
  vocabulary_register: number;
  sentence_rhythm: number;
  paragraph_structure: number;
  cta_style: number;
}

export interface GenerationVariant {
  content: string;
  variant_type: string;
  voice_match_score: number;
  word_count: number;
  dimension_scores?: DimensionScores;
}

export interface GenerationResponse {
  generation_id: string;
  variants: GenerationVariant[];
  trial_extended?: boolean;
}

export interface RepurposeResponse {
  generation_id: string;
  content: string;
  voice_match_score: number;
  trial_extended?: boolean;
}

export interface RegenerateVariantResponse {
  variant: GenerationVariant;
}

export interface DNAMatchDimension {
  key: string;
  label: string;
  score: number;
  rating: "strong" | "fair" | "weak";
  post_label: string;
  profile_label: string;
  guidance: string;
}

export interface DNAMatchResponse {
  overall_score: number;
  word_count: number;
  summary: string;
  dimensions: DNAMatchDimension[];
}

export interface EvalScore {
  fidelity_score: number | null;
  fidelity_pct: number | null;
  eval_count: number;
  has_data: boolean;
}

export interface IdeaItem {
  title: string;
  hook: string;
  content_type: string;
  rationale: string;
}

export interface IdeasResponse {
  ideas: IdeaItem[];
  niche: string;
  model: string;
}

export interface GenerationHistoryItem {
  id: string;
  input_text: string;
  input_type: string;
  variants: GenerationVariant[];
  created_at: string;
}

export type InteractionEventType =
  | "variant_shown"
  | "variant_selected"
  | "rejected_on_sight"
  | "regenerated"
  | "edited"
  | "copied"
  | "abandoned";

export interface InteractionEventPayload {
  generation_id?: string;
  variant_index?: number;
  event_type: InteractionEventType;
  rejection_reason?: "not_my_voice" | "wrong_angle" | "too_long" | "disagree";
  edit_distance_from_original?: number;
  word_count_delta?: number;
  time_to_action_ms?: number;
  session_id?: string;
}
