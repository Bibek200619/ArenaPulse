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
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
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
