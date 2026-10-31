export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          post_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_post_id_fkey';
            columns: ['parent_id', 'post_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id', 'post_id'];
          },
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      communities: {
        Row: {
          banner_url: string | null;
          competition_id: string | null;
          created_at: string;
          description: string;
          id: string;
          image_url: string | null;
          name: string;
          owner_id: string;
          rules: string;
          slug: string;
          sport_id: string | null;
          team_id: string | null;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          banner_url?: string | null;
          competition_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          owner_id: string;
          rules?: string;
          slug: string;
          sport_id?: string | null;
          team_id?: string | null;
          updated_at?: string;
          visibility: string;
        };
        Update: {
          banner_url?: string | null;
          competition_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          owner_id?: string;
          rules?: string;
          slug?: string;
          sport_id?: string | null;
          team_id?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'communities_competition_id_sport_id_fkey';
            columns: ['competition_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'communities_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'communities_sport_id_fkey';
            columns: ['sport_id'];
            isOneToOne: false;
            referencedRelation: 'sports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'communities_team_id_sport_id_fkey';
            columns: ['team_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      community_audit: {
        Row: {
          action: string;
          actor_id: string | null;
          community_id: string;
          created_at: string;
          detail: string;
          id: string;
          target_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          community_id: string;
          created_at?: string;
          detail?: string;
          id?: string;
          target_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          community_id?: string;
          created_at?: string;
          detail?: string;
          id?: string;
          target_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'community_audit_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_audit_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_audit_target_id_fkey';
            columns: ['target_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_bans: {
        Row: {
          banned_by: string | null;
          community_id: string;
          created_at: string;
          issuer_rank: number;
          reason: string;
          user_id: string;
        };
        Insert: {
          banned_by?: string | null;
          community_id: string;
          created_at?: string;
          issuer_rank: number;
          reason: string;
          user_id: string;
        };
        Update: {
          banned_by?: string | null;
          community_id?: string;
          created_at?: string;
          issuer_rank?: number;
          reason?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_bans_banned_by_fkey';
            columns: ['banned_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_bans_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_bans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_join_requests: {
        Row: {
          community_id: string;
          requested_at: string;
          resolved_at: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          community_id: string;
          requested_at?: string;
          resolved_at?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          community_id?: string;
          requested_at?: string;
          resolved_at?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_join_requests_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_join_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_members: {
        Row: {
          community_id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          community_id: string;
          joined_at?: string;
          role: string;
          user_id: string;
        };
        Update: {
          community_id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_members_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_post_reports: {
        Row: {
          community_id: string;
          created_at: string;
          id: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          community_id: string;
          created_at?: string;
          id?: string;
          post_id: string;
          reason: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          community_id?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_post_reports_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_post_reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_post_reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_post_reports_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      competition_follows: {
        Row: {
          competition_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          competition_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          competition_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'competition_follows_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'competition_follows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      competitions: {
        Row: {
          country: string;
          id: string;
          name: string;
          sport_id: string;
        };
        Insert: {
          country: string;
          id: string;
          name: string;
          sport_id: string;
        };
        Update: {
          country?: string;
          id?: string;
          name?: string;
          sport_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'competitions_sport_id_fkey';
            columns: ['sport_id'];
            isOneToOne: false;
            referencedRelation: 'sports';
            referencedColumns: ['id'];
          },
        ];
      };
      fantasy_competitions: {
        Row: {
          created_at: string;
          current_rule_version: number;
          id: string;
          name: string;
          source_competition_id: string;
          sport_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          current_rule_version?: number;
          id: string;
          name: string;
          source_competition_id: string;
          sport_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          current_rule_version?: number;
          id?: string;
          name?: string;
          source_competition_id?: string;
          sport_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_competitions_source_competition_id_sport_id_fkey';
            columns: ['source_competition_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      fantasy_gameweek_player_scores: {
        Row: {
          competition_id: string;
          gameweek_id: string;
          player_id: string;
          points: number;
          revision: number;
          rule_version: number;
        };
        Insert: {
          competition_id: string;
          gameweek_id: string;
          player_id: string;
          points: number;
          revision: number;
          rule_version: number;
        };
        Update: {
          competition_id?: string;
          gameweek_id?: string;
          player_id?: string;
          points?: number;
          revision?: number;
          rule_version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_gameweek_player_score_competition_id_rule_version__fkey';
            columns: ['competition_id', 'rule_version', 'player_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_player_prices';
            referencedColumns: ['competition_id', 'rule_version', 'player_id'];
          },
          {
            foreignKeyName: 'fantasy_gameweek_player_scores_gameweek_id_competition_id_fkey';
            columns: ['gameweek_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_gameweeks';
            referencedColumns: ['id', 'competition_id'];
          },
        ];
      };
      fantasy_gameweek_score_runs: {
        Row: {
          calculated_at: string;
          gameweek_id: string;
          revision: number;
          source_event_count: number;
        };
        Insert: {
          calculated_at?: string;
          gameweek_id: string;
          revision: number;
          source_event_count?: number;
        };
        Update: {
          calculated_at?: string;
          gameweek_id?: string;
          revision?: number;
          source_event_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_gameweek_score_runs_gameweek_id_fkey';
            columns: ['gameweek_id'];
            isOneToOne: true;
            referencedRelation: 'fantasy_gameweeks';
            referencedColumns: ['id'];
          },
        ];
      };
      fantasy_gameweeks: {
        Row: {
          competition_id: string;
          deadline_at: string;
          ends_at: string;
          id: string;
          name: string;
          number: number;
          rule_version: number;
          starts_at: string;
          status: string;
        };
        Insert: {
          competition_id: string;
          deadline_at: string;
          ends_at: string;
          id: string;
          name: string;
          number: number;
          rule_version: number;
          starts_at: string;
          status?: string;
        };
        Update: {
          competition_id?: string;
          deadline_at?: string;
          ends_at?: string;
          id?: string;
          name?: string;
          number?: number;
          rule_version?: number;
          starts_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_gameweeks_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_competitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fantasy_gameweeks_competition_id_rule_version_fkey';
            columns: ['competition_id', 'rule_version'];
            isOneToOne: false;
            referencedRelation: 'fantasy_rules';
            referencedColumns: ['competition_id', 'version'];
          },
        ];
      };
      fantasy_league_members: {
        Row: {
          competition_id: string;
          joined_at: string;
          league_id: string;
          role: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          competition_id: string;
          joined_at?: string;
          league_id: string;
          role?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          competition_id?: string;
          joined_at?: string;
          league_id?: string;
          role?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_league_members_league_id_competition_id_fkey';
            columns: ['league_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_leagues';
            referencedColumns: ['id', 'competition_id'];
          },
          {
            foreignKeyName: 'fantasy_league_members_team_id_competition_id_user_id_fkey';
            columns: ['team_id', 'competition_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_teams';
            referencedColumns: ['id', 'competition_id', 'user_id'];
          },
          {
            foreignKeyName: 'fantasy_league_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      fantasy_leagues: {
        Row: {
          competition_id: string;
          created_at: string;
          id: string;
          invite_code_hash: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          competition_id: string;
          created_at?: string;
          id?: string;
          invite_code_hash: string;
          name: string;
          owner_id: string;
        };
        Update: {
          competition_id?: string;
          created_at?: string;
          id?: string;
          invite_code_hash?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_leagues_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_competitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fantasy_leagues_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      fantasy_player_prices: {
        Row: {
          competition_id: string;
          player_id: string;
          price: number;
          rule_version: number;
          sport_id: string;
        };
        Insert: {
          competition_id: string;
          player_id: string;
          price: number;
          rule_version: number;
          sport_id: string;
        };
        Update: {
          competition_id?: string;
          player_id?: string;
          price?: number;
          rule_version?: number;
          sport_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_player_prices_competition_id_rule_version_fkey';
            columns: ['competition_id', 'rule_version'];
            isOneToOne: false;
            referencedRelation: 'fantasy_rules';
            referencedColumns: ['competition_id', 'version'];
          },
          {
            foreignKeyName: 'fantasy_player_prices_competition_id_sport_id_fkey';
            columns: ['competition_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_competitions';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'fantasy_player_prices_player_id_sport_id_fkey';
            columns: ['player_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      fantasy_rules: {
        Row: {
          budget: number;
          captain_multiplier: number;
          competition_id: string;
          created_at: string;
          position_limits: Json;
          scoring_rules: Json;
          squad_size: number;
          team_cap: number;
          transfers_per_gameweek: number;
          version: number;
          vice_captain_multiplier: number;
        };
        Insert: {
          budget: number;
          captain_multiplier: number;
          competition_id: string;
          created_at?: string;
          position_limits: Json;
          scoring_rules?: Json;
          squad_size: number;
          team_cap: number;
          transfers_per_gameweek: number;
          version: number;
          vice_captain_multiplier: number;
        };
        Update: {
          budget?: number;
          captain_multiplier?: number;
          competition_id?: string;
          created_at?: string;
          position_limits?: Json;
          scoring_rules?: Json;
          squad_size?: number;
          team_cap?: number;
          transfers_per_gameweek?: number;
          version?: number;
          vice_captain_multiplier?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_rules_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_competitions';
            referencedColumns: ['id'];
          },
        ];
      };
      fantasy_team_gameweek_scores: {
        Row: {
          base_points: number;
          captain_bonus: number;
          competition_id: string;
          gameweek_id: string;
          revision: number;
          team_id: string;
          total_points: number;
          vice_captain_bonus: number;
        };
        Insert: {
          base_points: number;
          captain_bonus: number;
          competition_id: string;
          gameweek_id: string;
          revision: number;
          team_id: string;
          total_points: number;
          vice_captain_bonus: number;
        };
        Update: {
          base_points?: number;
          captain_bonus?: number;
          competition_id?: string;
          gameweek_id?: string;
          revision?: number;
          team_id?: string;
          total_points?: number;
          vice_captain_bonus?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_team_gameweek_scores_gameweek_id_competition_id_fkey';
            columns: ['gameweek_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_gameweeks';
            referencedColumns: ['id', 'competition_id'];
          },
          {
            foreignKeyName: 'fantasy_team_gameweek_scores_team_id_competition_id_gamewe_fkey';
            columns: ['team_id', 'competition_id', 'gameweek_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_team_gameweeks';
            referencedColumns: ['team_id', 'competition_id', 'gameweek_id'];
          },
        ];
      };
      fantasy_team_gameweeks: {
        Row: {
          captain_player_id: string;
          competition_id: string;
          gameweek_id: string;
          rule_version: number;
          submitted_at: string;
          team_id: string;
          transfers_used: number;
          vice_captain_player_id: string;
        };
        Insert: {
          captain_player_id: string;
          competition_id: string;
          gameweek_id: string;
          rule_version: number;
          submitted_at?: string;
          team_id: string;
          transfers_used?: number;
          vice_captain_player_id: string;
        };
        Update: {
          captain_player_id?: string;
          competition_id?: string;
          gameweek_id?: string;
          rule_version?: number;
          submitted_at?: string;
          team_id?: string;
          transfers_used?: number;
          vice_captain_player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_team_gameweeks_competition_id_rule_version_fkey';
            columns: ['competition_id', 'rule_version'];
            isOneToOne: false;
            referencedRelation: 'fantasy_rules';
            referencedColumns: ['competition_id', 'version'];
          },
          {
            foreignKeyName: 'fantasy_team_gameweeks_gameweek_id_competition_id_fkey';
            columns: ['gameweek_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_gameweeks';
            referencedColumns: ['id', 'competition_id'];
          },
          {
            foreignKeyName: 'fantasy_team_gameweeks_team_id_competition_id_fkey';
            columns: ['team_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_teams';
            referencedColumns: ['id', 'competition_id'];
          },
        ];
      };
      fantasy_team_selections: {
        Row: {
          competition_id: string;
          gameweek_id: string;
          player_id: string;
          price_at_pick: number;
          rule_version: number;
          team_id: string;
        };
        Insert: {
          competition_id: string;
          gameweek_id: string;
          player_id: string;
          price_at_pick: number;
          rule_version: number;
          team_id: string;
        };
        Update: {
          competition_id?: string;
          gameweek_id?: string;
          player_id?: string;
          price_at_pick?: number;
          rule_version?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_team_selections_competition_id_rule_version_player_fkey';
            columns: ['competition_id', 'rule_version', 'player_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_player_prices';
            referencedColumns: ['competition_id', 'rule_version', 'player_id'];
          },
          {
            foreignKeyName: 'fantasy_team_selections_team_id_competition_id_gameweek_id_fkey';
            columns: ['team_id', 'competition_id', 'gameweek_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_team_gameweeks';
            referencedColumns: ['team_id', 'competition_id', 'gameweek_id'];
          },
        ];
      };
      fantasy_teams: {
        Row: {
          competition_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          competition_id: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          competition_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fantasy_teams_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'fantasy_competitions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fantasy_teams_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_discussion_messages: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          is_removed: boolean;
          match_id: string;
          parent_id: string | null;
          removal_reason: string | null;
          removed_at: string | null;
          removed_by: string | null;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          match_id: string;
          parent_id?: string | null;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          match_id?: string;
          parent_id?: string | null;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_discussion_messages_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_discussion_messages_parent_id_match_id_fkey';
            columns: ['parent_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_discussion_messages';
            referencedColumns: ['id', 'match_id'];
          },
          {
            foreignKeyName: 'match_discussion_messages_removed_by_fkey';
            columns: ['removed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_discussion_moderation_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          detail: string;
          id: string;
          match_id: string;
          message_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: string;
          id?: string;
          match_id: string;
          message_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: string;
          id?: string;
          match_id?: string;
          message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_discussion_moderation_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_discussion_reactions: {
        Row: {
          created_at: string;
          kind: string;
          match_id: string;
          message_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          kind?: string;
          match_id: string;
          message_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          kind?: string;
          match_id?: string;
          message_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_discussion_reactions_message_id_match_id_fkey';
            columns: ['message_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_discussion_messages';
            referencedColumns: ['id', 'match_id'];
          },
          {
            foreignKeyName: 'match_discussion_reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_discussion_reports: {
        Row: {
          created_at: string;
          id: string;
          match_id: string;
          message_id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_id: string;
          message_id: string;
          reason: string;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_id?: string;
          message_id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_discussion_reports_message_id_match_id_fkey';
            columns: ['message_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_discussion_messages';
            referencedColumns: ['id', 'match_id'];
          },
          {
            foreignKeyName: 'match_discussion_reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_discussion_reports_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_events: {
        Row: {
          clock: string;
          description: string;
          id: string;
          match_id: string;
          participant_id: string;
          period: string;
          player_id: string | null;
          sequence: number;
          type: string;
        };
        Insert: {
          clock: string;
          description: string;
          id: string;
          match_id: string;
          participant_id: string;
          period: string;
          player_id?: string | null;
          sequence: number;
          type: string;
        };
        Update: {
          clock?: string;
          description?: string;
          id?: string;
          match_id?: string;
          participant_id?: string;
          period?: string;
          player_id?: string | null;
          sequence?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_events_participant_id_match_id_fkey';
            columns: ['participant_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_participants';
            referencedColumns: ['id', 'match_id'];
          },
          {
            foreignKeyName: 'match_events_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      match_lineups: {
        Row: {
          match_id: string;
          participant_id: string;
          player_id: string;
          position: string;
          starter: boolean;
        };
        Insert: {
          match_id: string;
          participant_id: string;
          player_id: string;
          position: string;
          starter: boolean;
        };
        Update: {
          match_id?: string;
          participant_id?: string;
          player_id?: string;
          position?: string;
          starter?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'match_lineups_participant_id_match_id_fkey';
            columns: ['participant_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_participants';
            referencedColumns: ['id', 'match_id'];
          },
          {
            foreignKeyName: 'match_lineups_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      match_participants: {
        Row: {
          display_order: number;
          id: string;
          match_id: string;
          player_id: string | null;
          score: string | null;
          sport_id: string;
          team_id: string | null;
          winner: boolean | null;
        };
        Insert: {
          display_order: number;
          id: string;
          match_id: string;
          player_id?: string | null;
          score?: string | null;
          sport_id: string;
          team_id?: string | null;
          winner?: boolean | null;
        };
        Update: {
          display_order?: number;
          id?: string;
          match_id?: string;
          player_id?: string | null;
          score?: string | null;
          sport_id?: string;
          team_id?: string | null;
          winner?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_participants_match_id_sport_id_fkey';
            columns: ['match_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'match_participants_player_id_sport_id_fkey';
            columns: ['player_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'match_participants_team_id_sport_id_fkey';
            columns: ['team_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      match_statistics: {
        Row: {
          code: string;
          label: string;
          match_id: string;
          participant_id: string;
          unit: string | null;
          value: number;
        };
        Insert: {
          code: string;
          label: string;
          match_id: string;
          participant_id: string;
          unit?: string | null;
          value: number;
        };
        Update: {
          code?: string;
          label?: string;
          match_id?: string;
          participant_id?: string;
          unit?: string | null;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'match_statistics_participant_id_match_id_fkey';
            columns: ['participant_id', 'match_id'];
            isOneToOne: false;
            referencedRelation: 'match_participants';
            referencedColumns: ['id', 'match_id'];
          },
        ];
      };
      matches: {
        Row: {
          clock: string | null;
          competition_id: string;
          id: string;
          observed_at: string;
          season_id: string;
          source_id: string;
          sport_id: string;
          starts_at: string;
          state: string;
          venue_id: string | null;
        };
        Insert: {
          clock?: string | null;
          competition_id: string;
          id: string;
          observed_at: string;
          season_id: string;
          source_id: string;
          sport_id: string;
          starts_at: string;
          state: string;
          venue_id?: string | null;
        };
        Update: {
          clock?: string | null;
          competition_id?: string;
          id?: string;
          observed_at?: string;
          season_id?: string;
          source_id?: string;
          sport_id?: string;
          starts_at?: string;
          state?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_competition_id_sport_id_fkey';
            columns: ['competition_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'matches_season_id_competition_id_fkey';
            columns: ['season_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id', 'competition_id'];
          },
          {
            foreignKeyName: 'matches_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sports_data_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_sport_id_fkey';
            columns: ['sport_id'];
            isOneToOne: false;
            referencedRelation: 'sports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_outbox: {
        Row: {
          actor_id: string | null;
          created_at: string;
          dedupe_key: string;
          event_type: string;
          id: string;
          occurred_at: string;
          processed_at: string | null;
          recipient_id: string;
          related_id: string | null;
          status: string;
          target_id: string;
          target_type: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          dedupe_key: string;
          event_type: string;
          id?: string;
          occurred_at?: string;
          processed_at?: string | null;
          recipient_id: string;
          related_id?: string | null;
          status?: string;
          target_id: string;
          target_type: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          dedupe_key?: string;
          event_type?: string;
          id?: string;
          occurred_at?: string;
          processed_at?: string | null;
          recipient_id?: string;
          related_id?: string | null;
          status?: string;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_outbox_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_outbox_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          community_enabled: boolean;
          fantasy_enabled: boolean;
          in_app_enabled: boolean;
          match_enabled: boolean;
          social_enabled: boolean;
          time_zone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          community_enabled?: boolean;
          fantasy_enabled?: boolean;
          in_app_enabled?: boolean;
          match_enabled?: boolean;
          social_enabled?: boolean;
          time_zone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          community_enabled?: boolean;
          fantasy_enabled?: boolean;
          in_app_enabled?: boolean;
          match_enabled?: boolean;
          social_enabled?: boolean;
          time_zone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_reminders: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          local_scheduled_for: string;
          scheduled_for: string;
          status: string;
          target_id: string;
          target_type: string;
          time_zone: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label: string;
          local_scheduled_for: string;
          scheduled_for: string;
          status?: string;
          target_id: string;
          target_type: string;
          time_zone: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          local_scheduled_for?: string;
          scheduled_for?: string;
          status?: string;
          target_id?: string;
          target_type?: string;
          time_zone?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_reminders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          created_at: string;
          event_type: string;
          id: string;
          outbox_id: string;
          read_at: string | null;
          recipient_id: string;
          related_id: string | null;
          target_id: string;
          target_type: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          event_type: string;
          id?: string;
          outbox_id: string;
          read_at?: string | null;
          recipient_id: string;
          related_id?: string | null;
          target_id: string;
          target_type: string;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          event_type?: string;
          id?: string;
          outbox_id?: string;
          read_at?: string | null;
          recipient_id?: string;
          related_id?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_outbox_id_fkey';
            columns: ['outbox_id'];
            isOneToOne: true;
            referencedRelation: 'notification_outbox';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      player_follows: {
        Row: {
          created_at: string;
          player_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          player_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          player_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'player_follows_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'player_follows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          name: string;
          nationality: string;
          position: string;
          sport_id: string;
          team_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          nationality: string;
          position: string;
          sport_id: string;
          team_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          nationality?: string;
          position?: string;
          sport_id?: string;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'players_sport_id_fkey';
            columns: ['sport_id'];
            isOneToOne: false;
            referencedRelation: 'sports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'players_team_id_sport_id_fkey';
            columns: ['team_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          body: string;
          community_id: string | null;
          created_at: string;
          id: string;
          is_pinned: boolean;
          is_removed: boolean;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          community_id?: string | null;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          is_removed?: boolean;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          community_id?: string | null;
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          is_removed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_preferences: {
        Row: {
          favorite_sports: string[];
          onboarding_completed: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          favorite_sports?: string[];
          onboarding_completed?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          favorite_sports?: string[];
          onboarding_completed?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string;
          country: string;
          created_at: string;
          display_name: string;
          id: string;
          is_private: boolean;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string;
          country?: string;
          created_at?: string;
          display_name: string;
          id: string;
          is_private?: boolean;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string;
          country?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_private?: boolean;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          created_at: string;
          kind: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          kind?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          kind?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reactions_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      seasons: {
        Row: {
          competition_id: string;
          ends_on: string;
          id: string;
          name: string;
          starts_on: string;
        };
        Insert: {
          competition_id: string;
          ends_on: string;
          id: string;
          name: string;
          starts_on: string;
        };
        Update: {
          competition_id?: string;
          ends_on?: string;
          id?: string;
          name?: string;
          starts_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seasons_competition_id_fkey';
            columns: ['competition_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id'];
          },
        ];
      };
      sports: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      sports_data_sources: {
        Row: {
          id: string;
          is_demo: boolean;
          label: string;
        };
        Insert: {
          id: string;
          is_demo: boolean;
          label: string;
        };
        Update: {
          id?: string;
          is_demo?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      standings: {
        Row: {
          competition_id: string;
          drawn: number | null;
          lost: number;
          played: number;
          points: number;
          rank: number;
          season_id: string;
          sport_id: string;
          team_id: string;
          won: number;
        };
        Insert: {
          competition_id: string;
          drawn?: number | null;
          lost: number;
          played: number;
          points: number;
          rank: number;
          season_id: string;
          sport_id: string;
          team_id: string;
          won: number;
        };
        Update: {
          competition_id?: string;
          drawn?: number | null;
          lost?: number;
          played?: number;
          points?: number;
          rank?: number;
          season_id?: string;
          sport_id?: string;
          team_id?: string;
          won?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'standings_competition_id_sport_id_fkey';
            columns: ['competition_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'competitions';
            referencedColumns: ['id', 'sport_id'];
          },
          {
            foreignKeyName: 'standings_season_id_competition_id_fkey';
            columns: ['season_id', 'competition_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id', 'competition_id'];
          },
          {
            foreignKeyName: 'standings_team_id_sport_id_fkey';
            columns: ['team_id', 'sport_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id', 'sport_id'];
          },
        ];
      };
      team_follows: {
        Row: {
          created_at: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_follows_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_follows_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          color: string;
          country: string;
          id: string;
          name: string;
          short_name: string;
          sport_id: string;
        };
        Insert: {
          color: string;
          country: string;
          id: string;
          name: string;
          short_name: string;
          sport_id: string;
        };
        Update: {
          color?: string;
          country?: string;
          id?: string;
          name?: string;
          short_name?: string;
          sport_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_sport_id_fkey';
            columns: ['sport_id'];
            isOneToOne: false;
            referencedRelation: 'sports';
            referencedColumns: ['id'];
          },
        ];
      };
      user_blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string;
          followed_id: string;
          follower_id: string;
        };
        Insert: {
          created_at?: string;
          followed_id: string;
          follower_id: string;
        };
        Update: {
          created_at?: string;
          followed_id?: string;
          follower_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_follows_followed_id_fkey';
            columns: ['followed_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      venues: {
        Row: {
          city: string;
          country: string;
          id: string;
          name: string;
        };
        Insert: {
          city: string;
          country: string;
          id: string;
          name: string;
        };
        Update: {
          city?: string;
          country?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_notification_reminder: {
        Args: { p_id: string };
        Returns: boolean;
      };
      community_transition: {
        Args: {
          p_action: string;
          p_id: string;
          p_reason?: string;
          p_role?: string;
          p_target?: string;
        };
        Returns: string;
      };
      create_community: {
        Args: {
          p_competition_id?: string;
          p_description?: string;
          p_name: string;
          p_rules?: string;
          p_slug: string;
          p_sport_id?: string;
          p_team_id?: string;
          p_visibility?: string;
        };
        Returns: string;
      };
      create_fantasy_league: {
        Args: {
          p_competition_id: string;
          p_invite_code: string;
          p_name: string;
        };
        Returns: string;
      };
      create_match_discussion_message: {
        Args: { p_body: string; p_match_id: string; p_parent_id?: string };
        Returns: string;
      };
      delete_match_discussion_message: {
        Args: { p_match_id: string; p_message_id: string };
        Returns: boolean;
      };
      get_fantasy_league_leaderboard: {
        Args: { p_league_id: string };
        Returns: {
          display_name: string;
          gameweek_number: number;
          rank: number;
          team_name: string;
          total_points: number;
        }[];
      };
      join_fantasy_league: { Args: { p_invite_code: string }; Returns: string };
      mark_notification_read: { Args: { p_id: string }; Returns: boolean };
      moderate_community_post: {
        Args: { p_action: string; p_post: string };
        Returns: string;
      };
      moderate_match_discussion_message: {
        Args: { p_match_id: string; p_message_id: string };
        Returns: boolean;
      };
      process_my_notification_queue: { Args: never; Returns: number };
      recalculate_fantasy_gameweek_scores: {
        Args: { p_gameweek_id: string };
        Returns: number;
      };
      report_community_post: {
        Args: { p_post: string; p_reason: string };
        Returns: string;
      };
      report_match_discussion_message: {
        Args: { p_match_id: string; p_message_id: string; p_reason: string };
        Returns: string;
      };
      resolve_community_report: {
        Args: { p_action: string; p_report: string };
        Returns: string;
      };
      resolve_match_discussion_report: {
        Args: { p_action: string; p_report_id: string };
        Returns: boolean;
      };
      save_fantasy_squad: {
        Args: {
          p_captain_player_id: string;
          p_competition_id: string;
          p_gameweek_id: string;
          p_player_ids: string[];
          p_rule_version: number;
          p_vice_captain_player_id: string;
        };
        Returns: string;
      };
      save_notification_preferences: {
        Args: {
          p_community_enabled: boolean;
          p_fantasy_enabled: boolean;
          p_in_app_enabled: boolean;
          p_match_enabled: boolean;
          p_social_enabled: boolean;
          p_time_zone: string;
        };
        Returns: undefined;
      };
      save_profile: {
        Args: {
          p_bio: string;
          p_country: string;
          p_display_name: string;
          p_favorite_sports: string[];
          p_is_private: boolean;
          p_username: string;
        };
        Returns: undefined;
      };
      schedule_notification_reminder: {
        Args: {
          p_label: string;
          p_local_scheduled_for: string;
          p_target_id: string;
          p_target_type: string;
          p_time_zone: string;
        };
        Returns: string;
      };
      set_match_discussion_reaction: {
        Args: { p_active: boolean; p_match_id: string; p_message_id: string };
        Returns: boolean;
      };
      sports_follower_count: {
        Args: { p_id: string; p_kind: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
