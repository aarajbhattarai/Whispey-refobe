-- Refobe Database Schema
-- Copy and paste this entire file into Supabase SQL Editor
-- This script is idempotent - can be run multiple times safely

-- ==============================================
-- CLEANUP EXISTING OBJECTS
-- ==============================================

-- Drop existing materialized views
DROP MATERIALIZED VIEW IF EXISTS call_summary_materialized CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS refresh_call_summary() CASCADE;
DROP FUNCTION IF EXISTS batch_calculate_custom_totals(uuid, jsonb, date, date) CASCADE;
DROP FUNCTION IF EXISTS get_available_json_fields(uuid, text, integer) CASCADE;
DROP FUNCTION IF EXISTS get_distinct_values(uuid, text, text, integer) CASCADE;
DROP FUNCTION IF EXISTS calculate_custom_total(uuid, text, text, text, jsonb, text, date, date) CASCADE;
DROP FUNCTION IF EXISTS build_single_filter_condition(jsonb) CASCADE;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.pype_voice_call_logs_with_context CASCADE;
DROP TABLE IF EXISTS public.pype_voice_call_logs_backup CASCADE;
DROP TABLE IF EXISTS public.pype_voice_spans CASCADE;
DROP TABLE IF EXISTS public.pype_voice_session_traces CASCADE;
DROP TABLE IF EXISTS public.pype_voice_custom_totals_configs CASCADE;
DROP TABLE IF EXISTS public.pype_voice_agent_call_log_views CASCADE;
DROP TABLE IF EXISTS public.pype_voice_api_keys CASCADE;
DROP TABLE IF EXISTS public.pype_voice_email_project_mapping CASCADE;
DROP TABLE IF EXISTS public.pype_voice_call_logs CASCADE;
DROP TABLE IF EXISTS public.pype_voice_metrics_logs CASCADE;
DROP TABLE IF EXISTS public.pype_voice_agents CASCADE;
DROP TABLE IF EXISTS public.pype_voice_projects CASCADE;
DROP TABLE IF EXISTS public.pype_voice_users CASCADE;
DROP TABLE IF EXISTS public.usd_to_inr_rate CASCADE;
DROP TABLE IF EXISTS public.gpt_api_pricing_inr CASCADE;
DROP TABLE IF EXISTS public.gpt_api_pricing CASCADE;
DROP TABLE IF EXISTS public.audio_api_pricing CASCADE;

-- ==============================================
-- TABLES
-- ==============================================

CREATE TABLE public.pype_voice_metrics_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid,
    turn_id text,
    user_transcript text,
    agent_response text,
    stt_metrics jsonb,
    llm_metrics jsonb,
    tts_metrics jsonb,
    eou_metrics jsonb,
    lesson_day int4,
    created_at timestamp with time zone DEFAULT now(),
    unix_timestamp numeric,
    phone_number text,
    call_duration numeric,
    call_success boolean,
    lesson_completed boolean,
    trace_id text,
    trace_duration_ms int4,
    trace_cost_usd float8,
    turn_configuration jsonb,
    bug_report boolean,
    bug_details text,
    enhanced_data jsonb,
    tool_calls jsonb
);

CREATE TABLE public.pype_voice_call_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id varchar,
    agent_id uuid,
    customer_number varchar,
    call_ended_reason varchar,
    transcript_type varchar,
    transcript_json jsonb,
    metadata jsonb,
    dynamic_variables jsonb,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    call_started_at timestamp with time zone,
    call_ended_at timestamp with time zone,
    duration_seconds int4,
    recording_url text,
    voice_recording_url text,
    avg_latency float8,
    transcription_metrics jsonb,
    total_stt_cost float8,
    total_tts_cost float8,
    total_llm_cost float8,
    complete_configuration jsonb,
    telemetry_data jsonb,
    telemetry_analytics jsonb
);

CREATE TABLE public.pype_voice_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    name varchar,
    agent_type varchar,
    configuration jsonb,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true,
    user_id uuid,
    field_extractor boolean,
    field_extractor_prompt text,
    field_extractor_keys jsonb
);

CREATE TABLE public.pype_voice_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar,
    description text,
    environment varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_active boolean DEFAULT true,
    retry_configuration jsonb,
    token_hash text,
    owner_clerk_id text,
    campaign_config jsonb
);

CREATE TABLE public.pype_voice_email_project_mapping (
    id serial PRIMARY KEY,
    email text,
    project_id uuid,
    role text,
    permissions jsonb,
    added_by_clerk_id text,
    created_at timestamp with time zone DEFAULT now(),
    clerk_id text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.pype_voice_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    user_clerk_id text NOT NULL,
    token_hash text NOT NULL,
    token_hash_master text NOT NULL,
    masked_key varchar(50) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_used timestamp
);

CREATE TABLE public.pype_voice_agent_call_log_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid,
    name text,
    filters jsonb,
    visible_columns jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);

CREATE TABLE public.audio_api_pricing (
    service_type text,
    provider text,
    model_or_plan text,
    unit text,
    cost_usd_per_unit numeric,
    valid_from date,
    source_url text
);

CREATE TABLE public.gpt_api_pricing (
    model_name text,
    input_usd_per_million numeric,
    output_usd_per_million numeric,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.gpt_api_pricing_inr (
    model_name text,
    input_inr_per_million numeric,
    output_inr_per_million numeric,
    rate_date date,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pype_voice_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text,
    first_name text,
    last_name text,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    clerk_id text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.usd_to_inr_rate (
    as_of date,
    rate numeric,
    source text
);

CREATE TABLE public.pype_voice_custom_totals_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid,
    agent_id uuid,
    name varchar,
    description text,
    aggregation varchar,
    column_name varchar,
    json_field varchar,
    filters jsonb DEFAULT '[]'::jsonb,
    filter_logic varchar DEFAULT 'AND',
    icon varchar,
    color varchar,
    created_by varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.pype_voice_session_traces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid,
    total_spans int4 DEFAULT 0,
    performance_summary jsonb DEFAULT '{}'::jsonb,
    span_summary jsonb DEFAULT '{}'::jsonb,
    session_start_time timestamp,
    session_end_time timestamp,
    total_duration_ms int4,
    created_at timestamp DEFAULT now(),
    trace_key varchar(255)
);

CREATE TABLE public.pype_voice_spans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    span_id text,
    trace_id text,
    name text,
    operation_type text,
    start_time_ns bigint,
    end_time_ns bigint,
    duration_ms int4,
    status jsonb,
    attributes jsonb,
    events jsonb,
    metadata jsonb,
    request_id text,
    parent_span_id text,
    created_at timestamp DEFAULT now(),
    duration_ns bigint,
    captured_at timestamp,
    context jsonb,
    request_id_source text,
    trace_key varchar(255) NOT NULL
);

CREATE TABLE public.pype_voice_call_logs_backup (
    id uuid,
    call_id varchar,
    agent_id uuid,
    customer_number varchar,
    call_ended_reason varchar,
    transcript_type varchar,
    transcript_json jsonb,
    metadata jsonb,
    dynamic_variables jsonb,
    environment varchar,
    created_at timestamp,
    call_started_at timestamp,
    call_ended_at timestamp,
    duration_seconds int4,
    recording_url text,
    voice_recording_url text,
    avg_latency float8,
    transcription_metrics jsonb,
    total_stt_cost float8,
    total_tts_cost float8,
    total_llm_cost float8,
    complete_configuration jsonb,
    telemetry_data jsonb,
    telemetry_analytics jsonb
);

CREATE TABLE public.pype_voice_call_logs_with_context (
    id uuid,
    call_id varchar,
    agent_id uuid,
    customer_number varchar,
    call_ended_reason varchar,
    transcript_type varchar,
    transcript_json jsonb,
    metadata jsonb,
    dynamic_variables jsonb,
    environment varchar,
    created_at timestamp,
    call_started_at timestamp,
    call_ended_at timestamp,
    duration_seconds int4,
    agent_name varchar,
    agent_type varchar,
    project_name varchar,
    project_id uuid
);

-- ==============================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key relationships (safe to run multiple times)
DO $$ 
BEGIN
    -- Add foreign key for agents -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agents_project_id' 
        AND table_name = 'pype_voice_agents'
    ) THEN
        ALTER TABLE public.pype_voice_agents 
            ADD CONSTRAINT fk_agents_project_id 
            FOREIGN KEY (project_id) REFERENCES public.pype_voice_projects(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for call_logs -> agents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_call_logs_agent_id' 
        AND table_name = 'pype_voice_call_logs'
    ) THEN
        ALTER TABLE public.pype_voice_call_logs 
            ADD CONSTRAINT fk_call_logs_agent_id 
            FOREIGN KEY (agent_id) REFERENCES public.pype_voice_agents(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for email_mapping -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_email_mapping_project_id' 
        AND table_name = 'pype_voice_email_project_mapping'
    ) THEN
        ALTER TABLE public.pype_voice_email_project_mapping 
            ADD CONSTRAINT fk_email_mapping_project_id 
            FOREIGN KEY (project_id) REFERENCES public.pype_voice_projects(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for api_keys -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_api_keys_project_id' 
        AND table_name = 'pype_voice_api_keys'
    ) THEN
        ALTER TABLE public.pype_voice_api_keys 
            ADD CONSTRAINT fk_api_keys_project_id 
            FOREIGN KEY (project_id) REFERENCES public.pype_voice_projects(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for agent_views -> agents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agent_views_agent_id' 
        AND table_name = 'pype_voice_agent_call_log_views'
    ) THEN
        ALTER TABLE public.pype_voice_agent_call_log_views 
            ADD CONSTRAINT fk_agent_views_agent_id 
            FOREIGN KEY (agent_id) REFERENCES public.pype_voice_agents(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for custom_totals -> projects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_custom_totals_project_id' 
        AND table_name = 'pype_voice_custom_totals_configs'
    ) THEN
        ALTER TABLE public.pype_voice_custom_totals_configs 
            ADD CONSTRAINT fk_custom_totals_project_id 
            FOREIGN KEY (project_id) REFERENCES public.pype_voice_projects(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for custom_totals -> agents
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_custom_totals_agent_id' 
        AND table_name = 'pype_voice_custom_totals_configs'
    ) THEN
        ALTER TABLE public.pype_voice_custom_totals_configs 
            ADD CONSTRAINT fk_custom_totals_agent_id 
            FOREIGN KEY (agent_id) REFERENCES public.pype_voice_agents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on tables (safe to run multiple times)
DO $$ 
BEGIN
    -- Enable RLS on custom_totals_configs
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pype_voice_custom_totals_configs' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.pype_voice_custom_totals_configs ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on session_traces
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pype_voice_session_traces' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.pype_voice_session_traces ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on spans
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pype_voice_spans' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.pype_voice_spans ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on call_logs_backup
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pype_voice_call_logs_backup' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.pype_voice_call_logs_backup ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on call_logs_with_context
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pype_voice_call_logs_with_context' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.pype_voice_call_logs_with_context ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ==============================================
-- MATERIALIZED VIEWS
-- ==============================================

CREATE MATERIALIZED VIEW call_summary_materialized AS
SELECT
  agent_id,
  DATE(created_at) AS call_date,
  COUNT(*) AS calls,
  SUM(duration_seconds) AS total_seconds,
  ROUND(SUM(duration_seconds)::numeric / 60, 0) AS total_minutes,
  AVG(avg_latency) AS avg_latency,
  COUNT(DISTINCT call_id) AS unique_customers,
  COUNT(*) FILTER (WHERE call_ended_reason = 'completed') AS successful_calls,
  ROUND(
    (COUNT(*) FILTER (WHERE call_ended_reason = 'completed')::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS success_rate,
  -- Telecom cost only for completed calls (रु  0.70 per started minute)
  SUM(
    CEIL(duration_seconds::numeric / 60)
  ) FILTER (WHERE call_ended_reason = 'completed') * 0.70 AS telecom_cost,
  -- Total LLM+TTS+STT cost only for completed calls
  (
    COALESCE(SUM(total_llm_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_tts_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + COALESCE(SUM(total_stt_cost) FILTER (WHERE call_ended_reason = 'completed'), 0)
    + SUM(CEIL(duration_seconds::numeric / 60)) FILTER (WHERE call_ended_reason = 'completed') * 0.70
  )::numeric(16, 2) AS total_cost
FROM pype_voice_call_logs
GROUP BY agent_id, DATE(created_at);

CREATE UNIQUE INDEX call_summary_agent_date_idx
  ON call_summary_materialized (agent_id, call_date);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Helper function to build individual filter conditions
CREATE OR REPLACE FUNCTION build_single_filter_condition(filter_obj JSONB)
RETURNS TEXT AS $$
DECLARE
  column_name TEXT;
  json_field TEXT;
  operation TEXT;
  filter_value TEXT;
  condition TEXT := '';
BEGIN
  -- Extract filter properties
  column_name := filter_obj->>'column';
  json_field := filter_obj->>'jsonField';
  operation := filter_obj->>'operation';
  filter_value := filter_obj->>'value';

  -- Normalize empty strings to NULL
  IF json_field = '' OR json_field = 'null' THEN
    json_field := NULL;
  END IF;

  -- Validate required fields
  IF column_name IS NULL OR operation IS NULL THEN
    RETURN '';
  END IF;

  -- Build condition based on operation
  CASE operation
    WHEN 'equals', 'json_equals' THEN
      IF json_field IS NOT NULL THEN
        condition := quote_ident(column_name) || '->>' || quote_literal(json_field) || ' = ' || quote_literal(filter_value);
      ELSE
        condition := quote_ident(column_name) || ' = ' || quote_literal(filter_value);
      END IF;
    
    WHEN 'contains', 'json_contains' THEN
      IF json_field IS NOT NULL THEN
        condition := quote_ident(column_name) || '->>' || quote_literal(json_field) || ' ILIKE ' || quote_literal('%' || filter_value || '%');
      ELSE
        condition := quote_ident(column_name) || ' ILIKE ' || quote_literal('%' || filter_value || '%');
      END IF;
    
    WHEN 'starts_with' THEN
      IF json_field IS NOT NULL THEN
        condition := quote_ident(column_name) || '->>' || quote_literal(json_field) || ' ILIKE ' || quote_literal(filter_value || '%');
      ELSE
        condition := quote_ident(column_name) || ' ILIKE ' || quote_literal(filter_value || '%');
      END IF;
    
    WHEN 'greater_than', 'json_greater_than' THEN
      IF json_field IS NOT NULL THEN
        condition := '(' || quote_ident(column_name) || '->>' || quote_literal(json_field) || ')::NUMERIC > ' || quote_literal(filter_value) || '::NUMERIC';
      ELSE
        condition := quote_ident(column_name) || ' > ' || quote_literal(filter_value) || '::NUMERIC';
      END IF;
    
    WHEN 'less_than', 'json_less_than' THEN
      IF json_field IS NOT NULL THEN
        condition := '(' || quote_ident(column_name) || '->>' || quote_literal(json_field) || ')::NUMERIC < ' || quote_literal(filter_value) || '::NUMERIC';
      ELSE
        condition := quote_ident(column_name) || ' < ' || quote_literal(filter_value) || '::NUMERIC';
      END IF;
    
    WHEN 'json_exists' THEN
      IF json_field IS NOT NULL THEN
        condition := quote_ident(column_name) || '->>' || quote_literal(json_field) || ' IS NOT NULL AND ' ||
                    quote_ident(column_name) || '->>' || quote_literal(json_field) || ' != ''''';
      ELSE
        condition := quote_ident(column_name) || ' IS NOT NULL';
      END IF;
    
    ELSE
      condition := '';
  END CASE;

  RETURN condition;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main function to calculate custom totals
CREATE OR REPLACE FUNCTION calculate_custom_total(
    p_agent_id UUID,
    p_aggregation TEXT,
    p_column_name TEXT,
    p_json_field TEXT DEFAULT NULL,
    p_filters JSONB DEFAULT '[]'::jsonb,
    p_filter_logic TEXT DEFAULT 'AND',
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE(
    result NUMERIC,
    error_message TEXT
) AS $$
DECLARE
    base_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    filter_conditions TEXT[] := ARRAY[]::TEXT[];
    final_where TEXT := '';
    result_value NUMERIC := 0;
    error_msg TEXT := NULL;
    rec RECORD;
    filter_item JSONB;
    filter_condition TEXT;
BEGIN
    -- Normalize p_json_field
    IF p_json_field = '' OR p_json_field = 'null' THEN
        p_json_field := NULL;
    END IF;

    -- Build base query
    IF p_aggregation = 'COUNT' THEN
        base_query := 'SELECT COUNT(*) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        
    ELSIF p_aggregation = 'COUNT_DISTINCT' THEN
        IF p_json_field IS NOT NULL THEN
            base_query := 'SELECT COUNT(DISTINCT (' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ')) as result FROM pype_voice_call_logs WHERE agent_id = $1 AND ' || 
                         quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' IS NOT NULL AND ' ||
                         quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' != ''''';
        ELSE
            base_query := 'SELECT COUNT(DISTINCT ' || quote_ident(p_column_name) || ') as result FROM pype_voice_call_logs WHERE agent_id = $1 AND ' || quote_ident(p_column_name) || ' IS NOT NULL';
        END IF;
        
    ELSIF p_aggregation = 'SUM' THEN
        IF p_json_field IS NOT NULL THEN
            base_query := 'SELECT COALESCE(SUM(CASE WHEN ' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' ~ ''^-?[0-9]+\.?[0-9]*$'' THEN (' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ')::NUMERIC ELSE 0 END), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        ELSE
            base_query := 'SELECT COALESCE(SUM(' || quote_ident(p_column_name) || '), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        END IF;
        
    ELSIF p_aggregation = 'AVG' THEN
        IF p_json_field IS NOT NULL THEN
            base_query := 'SELECT COALESCE(AVG(CASE WHEN ' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' ~ ''^-?[0-9]+\.?[0-9]*$'' THEN (' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ')::NUMERIC ELSE NULL END), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        ELSE
            base_query := 'SELECT COALESCE(AVG(' || quote_ident(p_column_name) || '), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        END IF;
        
    ELSIF p_aggregation = 'MIN' THEN
        IF p_json_field IS NOT NULL THEN
            base_query := 'SELECT COALESCE(MIN(CASE WHEN ' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' ~ ''^-?[0-9]+\.?[0-9]*$'' THEN (' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ')::NUMERIC ELSE NULL END), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        ELSE
            base_query := 'SELECT COALESCE(MIN(' || quote_ident(p_column_name) || '), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        END IF;
        
    ELSIF p_aggregation = 'MAX' THEN
        IF p_json_field IS NOT NULL THEN
            base_query := 'SELECT COALESCE(MAX(CASE WHEN ' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' ~ ''^-?[0-9]+\.?[0-9]*$'' THEN (' || quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ')::NUMERIC ELSE NULL END), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        ELSE
            base_query := 'SELECT COALESCE(MAX(' || quote_ident(p_column_name) || '), 0) as result FROM pype_voice_call_logs WHERE agent_id = $1';
        END IF;
        
    ELSE
        error_msg := 'Unsupported aggregation type: ' || p_aggregation;
        RETURN QUERY SELECT NULL::NUMERIC, error_msg;
        RETURN;
    END IF;

    -- Add date range conditions
    IF p_date_from IS NOT NULL THEN
        where_conditions := array_append(where_conditions, 
            'call_started_at >= ' || quote_literal(p_date_from || ' 00:00:00'));
    END IF;
    
    IF p_date_to IS NOT NULL THEN
        where_conditions := array_append(where_conditions, 
            'call_started_at <= ' || quote_literal(p_date_to || ' 23:59:59.999'));
    END IF;

    -- For COUNT operations with JSON fields, add the field existence check
    IF p_aggregation = 'COUNT' AND p_json_field IS NOT NULL THEN
        where_conditions := array_append(where_conditions,
            quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' IS NOT NULL AND ' ||
            quote_ident(p_column_name) || '->>' || quote_literal(p_json_field) || ' != ''''');
    END IF;

    -- Process custom filters
    FOR filter_item IN SELECT * FROM jsonb_array_elements(p_filters)
    LOOP
        filter_condition := build_single_filter_condition(filter_item);
        IF filter_condition IS NOT NULL AND filter_condition != '' THEN
            filter_conditions := array_append(filter_conditions, filter_condition);
        END IF;
    END LOOP;

    -- Build final WHERE clause
    final_where := '';
    IF array_length(where_conditions, 1) > 0 THEN
        final_where := ' AND ' || array_to_string(where_conditions, ' AND ');
    END IF;

    IF array_length(filter_conditions, 1) > 0 THEN
        IF p_filter_logic = 'OR' THEN
            final_where := final_where || ' AND (' || array_to_string(filter_conditions, ' OR ') || ')';
        ELSE
            final_where := final_where || ' AND (' || array_to_string(filter_conditions, ' AND ') || ')';
        END IF;
    END IF;

    base_query := base_query || final_where;

    -- Execute the query
    BEGIN
        EXECUTE base_query INTO rec USING p_agent_id;
        result_value := rec.result;
        RETURN QUERY SELECT COALESCE(result_value, 0), error_msg;
    EXCEPTION WHEN OTHERS THEN
        error_msg := 'Query execution error: ' || SQLERRM || ' | Query: ' || base_query;
        RETURN QUERY SELECT NULL::NUMERIC, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get distinct values
CREATE OR REPLACE FUNCTION get_distinct_values(
  p_agent_id uuid,
  p_column_name text,
  p_json_field text DEFAULT NULL::text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(distinct_value text, count_occurrences bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
BEGIN
  IF p_json_field IS NOT NULL THEN
    query_text := format('
      SELECT DISTINCT %I->>%L as distinct_value, 
             COUNT(*) as count_occurrences
      FROM pype_voice_call_logs 
      WHERE agent_id = $1 
        AND %I->>%L IS NOT NULL
      GROUP BY %I->>%L
      ORDER BY count_occurrences DESC, distinct_value
      LIMIT $2',
      p_column_name, p_json_field,
      p_column_name, p_json_field,
      p_column_name, p_json_field);
  ELSE
    query_text := format('
      SELECT DISTINCT %I::TEXT as distinct_value,
             COUNT(*) as count_occurrences
      FROM pype_voice_call_logs 
      WHERE agent_id = $1 
        AND %I IS NOT NULL
      GROUP BY %I
      ORDER BY count_occurrences DESC, distinct_value
      LIMIT $2',
      p_column_name,
      p_column_name,
      p_column_name);
  END IF;

  RETURN QUERY EXECUTE query_text USING p_agent_id, p_limit;
END;
$$;

-- Function to get available JSON fields
CREATE OR REPLACE FUNCTION get_available_json_fields(
  p_agent_id uuid,
  p_column_name text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(field_name text, sample_value text, occurrences bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
BEGIN
  query_text := format('
    WITH json_keys AS (
      SELECT jsonb_object_keys(%I) as key_name, %I->>jsonb_object_keys(%I) as sample_val
      FROM pype_voice_call_logs 
      WHERE agent_id = $1 AND %I IS NOT NULL
      LIMIT 1000
    )
    SELECT 
      key_name as field_name,
      sample_val as sample_value,
      COUNT(*) as occurrences
    FROM json_keys
    GROUP BY key_name, sample_val
    ORDER BY occurrences DESC, key_name
    LIMIT $2',
    p_column_name, p_column_name, p_column_name, p_column_name);

  RETURN QUERY EXECUTE query_text USING p_agent_id, p_limit;
END;
$$;

-- Function to batch calculate custom totals
CREATE OR REPLACE FUNCTION batch_calculate_custom_totals(
  p_agent_id uuid,
  p_configs jsonb,
  p_date_from date DEFAULT NULL::date,
  p_date_to date DEFAULT NULL::date
)
RETURNS TABLE(config_id text, result numeric, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_item JSONB;
  aggregation TEXT;
  column_name TEXT;
  json_field TEXT;
  filters JSONB;
  filter_logic TEXT;
  calc_result RECORD;
BEGIN
  FOR config_item IN SELECT * FROM jsonb_array_elements(p_configs)
  LOOP
    aggregation := config_item->>'aggregation';
    column_name := config_item->>'column';
    json_field := config_item->>'jsonField';
    filters := COALESCE(config_item->'filters', '[]'::jsonb);
    filter_logic := COALESCE(config_item->>'filterLogic', 'AND');

    SELECT * INTO calc_result
    FROM calculate_custom_total(
      p_agent_id,
      aggregation,
      column_name,
      json_field,
      filters,
      filter_logic,
      p_date_from,
      p_date_to
    );

    RETURN QUERY SELECT 
      config_item->>'id',
      calc_result.result,
      calc_result.error_message;
  END LOOP;
END;
$$;

-- Function to refresh call summary
CREATE OR REPLACE FUNCTION refresh_call_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY call_summary_materialized;
END;
$$;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Create RLS policies for session traces (allow all operations for now)
CREATE POLICY "Allow all operations on session traces" ON public.pype_voice_session_traces
    FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for spans (allow all operations for now)
CREATE POLICY "Allow all operations on spans" ON public.pype_voice_spans
    FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for custom totals configs (allow all operations for now)
CREATE POLICY "Allow all operations on custom totals configs" ON public.pype_voice_custom_totals_configs
    FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for call logs backup (allow all operations for now)
CREATE POLICY "Allow all operations on call logs backup" ON public.pype_voice_call_logs_backup
    FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for call logs with context (allow all operations for now)
CREATE POLICY "Allow all operations on call logs with context" ON public.pype_voice_call_logs_with_context
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY call_summary_materialized;