-- Recommendations Tracking Migration for CourseAiChat
-- This file creates tables for tracking user interactions with recommendations and feedback

-- 1. User Recommendation Interactions (tracks which recommendations were shown to users)
CREATE TABLE user_recommendation_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    recommendation_score DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    recommendation_reasons TEXT[], -- Array of recommendation reasons
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    match_percentage INTEGER NOT NULL, -- 0 to 100
    algorithm_used VARCHAR(100) NOT NULL DEFAULT 'hybrid-content-field-popularity',
    user_interests JSONB, -- Store user interests at time of recommendation
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'unknown')),
    question_count_at_time INTEGER NOT NULL DEFAULT 0,
    is_fallback BOOLEAN DEFAULT false, -- Whether this was a fallback recommendation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Feedback on Recommendations (tracks user actions on recommendations)
CREATE TABLE user_recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID NOT NULL REFERENCES user_recommendation_interactions(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('interested', 'not_interested', 'viewed_details', 'shared', 'bookmarked')),
    feedback_data JSONB, -- Additional feedback data (e.g., rating, comments)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recommendation Analytics (aggregated data for improving recommendations)
CREATE TABLE recommendation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    total_shown INTEGER NOT NULL DEFAULT 0,
    total_interested INTEGER NOT NULL DEFAULT 0,
    total_not_interested INTEGER NOT NULL DEFAULT 0,
    total_viewed_details INTEGER NOT NULL DEFAULT 0,
    total_shared INTEGER NOT NULL DEFAULT 0,
    total_bookmarked INTEGER NOT NULL DEFAULT 0,
    average_score DECIMAL(3,2) DEFAULT 0.00,
    average_confidence DECIMAL(3,2) DEFAULT 0.00,
    conversion_rate DECIMAL(3,2) DEFAULT 0.00, -- interested / shown
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Interest Tracking (tracks user interests over time)
CREATE TABLE user_interest_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    interest_topic VARCHAR(200) NOT NULL,
    interest_weight DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    mentions INTEGER NOT NULL DEFAULT 1,
    last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Recommendation Triggers (logs when and why recommendations were triggered)
CREATE TABLE recommendation_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    trigger_reason VARCHAR(100) NOT NULL CHECK (trigger_reason IN ('question_count', 'time_based', 'user_request', 'session_end')),
    trigger_data JSONB, -- Additional context (e.g., question_count, time_elapsed)
    recommendations_generated INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes

-- User Recommendation Interactions indexes
CREATE INDEX idx_user_recommendation_interactions_session_id ON user_recommendation_interactions(session_id);
CREATE INDEX idx_user_recommendation_interactions_learning_path_id ON user_recommendation_interactions(learning_path_id);
CREATE INDEX idx_user_recommendation_interactions_field_id ON user_recommendation_interactions(field_id);
CREATE INDEX idx_user_recommendation_interactions_created_at ON user_recommendation_interactions(created_at);
CREATE INDEX idx_user_recommendation_interactions_score ON user_recommendation_interactions(recommendation_score);

-- User Recommendation Feedback indexes
CREATE INDEX idx_user_recommendation_feedback_interaction_id ON user_recommendation_feedback(interaction_id);
CREATE INDEX idx_user_recommendation_feedback_session_id ON user_recommendation_feedback(session_id);
CREATE INDEX idx_user_recommendation_feedback_learning_path_id ON user_recommendation_feedback(learning_path_id);
CREATE INDEX idx_user_recommendation_feedback_type ON user_recommendation_feedback(feedback_type);
CREATE INDEX idx_user_recommendation_feedback_created_at ON user_recommendation_feedback(created_at);

-- Recommendation Analytics indexes
CREATE INDEX idx_recommendation_analytics_field_id ON recommendation_analytics(field_id);
CREATE INDEX idx_recommendation_analytics_learning_path_id ON recommendation_analytics(learning_path_id);
CREATE INDEX idx_recommendation_analytics_conversion_rate ON recommendation_analytics(conversion_rate);
CREATE INDEX idx_recommendation_analytics_last_updated ON recommendation_analytics(last_updated);

-- User Interest Tracking indexes
CREATE INDEX idx_user_interest_tracking_session_id ON user_interest_tracking(session_id);
CREATE INDEX idx_user_interest_tracking_field_id ON user_interest_tracking(field_id);
CREATE INDEX idx_user_interest_tracking_topic ON user_interest_tracking(interest_topic);
CREATE INDEX idx_user_interest_tracking_weight ON user_interest_tracking(interest_weight);
CREATE INDEX idx_user_interest_tracking_last_mentioned ON user_interest_tracking(last_mentioned);

-- Recommendation Triggers indexes
CREATE INDEX idx_recommendation_triggers_session_id ON recommendation_triggers(session_id);
CREATE INDEX idx_recommendation_triggers_field_id ON recommendation_triggers(field_id);
CREATE INDEX idx_recommendation_triggers_reason ON recommendation_triggers(trigger_reason);
CREATE INDEX idx_recommendation_triggers_created_at ON recommendation_triggers(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all new tables
ALTER TABLE user_recommendation_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interest_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_triggers ENABLE ROW LEVEL SECURITY;

-- User Recommendation Interactions RLS Policies
CREATE POLICY "User recommendation interactions are viewable by everyone" ON user_recommendation_interactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage user recommendation interactions" ON user_recommendation_interactions
    FOR ALL USING (true);

-- User Recommendation Feedback RLS Policies
CREATE POLICY "User recommendation feedback is viewable by everyone" ON user_recommendation_feedback
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage user recommendation feedback" ON user_recommendation_feedback
    FOR ALL USING (true);

-- Recommendation Analytics RLS Policies
CREATE POLICY "Recommendation analytics are viewable by everyone" ON recommendation_analytics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage recommendation analytics" ON recommendation_analytics
    FOR ALL USING (true);

-- User Interest Tracking RLS Policies
CREATE POLICY "User interest tracking is viewable by everyone" ON user_interest_tracking
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage user interest tracking" ON user_interest_tracking
    FOR ALL USING (true);

-- Recommendation Triggers RLS Policies
CREATE POLICY "Recommendation triggers are viewable by everyone" ON recommendation_triggers
    FOR SELECT USING (true);

CREATE POLICY "Anyone can manage recommendation triggers" ON recommendation_triggers
    FOR ALL USING (true);

-- Create updated_at trigger function (if not exists)
-- Note: Function already exists from previous migrations, so we'll just ensure it's available
-- The function was already created in migration 20240101000002

-- Create triggers for updated_at
CREATE TRIGGER update_user_recommendation_interactions_updated_at BEFORE UPDATE ON user_recommendation_interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function for updating analytics
CREATE OR REPLACE FUNCTION update_recommendation_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics when new feedback is provided
    INSERT INTO recommendation_analytics (
        field_id, 
        learning_path_id, 
        total_shown, 
        total_interested, 
        total_not_interested,
        total_viewed_details,
        total_shared,
        total_bookmarked,
        average_score,
        average_confidence,
        conversion_rate
    )
    SELECT 
        i.field_id,
        i.learning_path_id,
        1, -- total_shown
        CASE WHEN NEW.feedback_type = 'interested' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'not_interested' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'viewed_details' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'shared' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'bookmarked' THEN 1 ELSE 0 END,
        i.recommendation_score,
        i.confidence,
        CASE WHEN NEW.feedback_type = 'interested' THEN 1.0 ELSE 0.0 END
    FROM user_recommendation_interactions i
    WHERE i.id = NEW.interaction_id
    ON CONFLICT (field_id, learning_path_id) DO UPDATE SET
        total_shown = recommendation_analytics.total_shown + 1,
        total_interested = recommendation_analytics.total_interested + 
            CASE WHEN NEW.feedback_type = 'interested' THEN 1 ELSE 0 END,
        total_not_interested = recommendation_analytics.total_not_interested + 
            CASE WHEN NEW.feedback_type = 'not_interested' THEN 1 ELSE 0 END,
        total_viewed_details = recommendation_analytics.total_viewed_details + 
            CASE WHEN NEW.feedback_type = 'viewed_details' THEN 1 ELSE 0 END,
        total_shared = recommendation_analytics.total_shared + 
            CASE WHEN NEW.feedback_type = 'shared' THEN 1 ELSE 0 END,
        total_bookmarked = recommendation_analytics.total_bookmarked + 
            CASE WHEN NEW.feedback_type = 'bookmarked' THEN 1 ELSE 0 END,
        average_score = (recommendation_analytics.average_score * recommendation_analytics.total_shown + i.recommendation_score) / 
            (recommendation_analytics.total_shown + 1),
        average_confidence = (recommendation_analytics.average_confidence * recommendation_analytics.total_shown + i.confidence) / 
            (recommendation_analytics.total_shown + 1),
        conversion_rate = CAST(recommendation_analytics.total_interested + 
            CASE WHEN NEW.feedback_type = 'interested' THEN 1 ELSE 0 END AS DECIMAL) / 
            CAST(recommendation_analytics.total_shown + 1 AS DECIMAL),
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic analytics updates
CREATE TRIGGER update_recommendation_analytics_trigger
    AFTER INSERT ON user_recommendation_feedback
    FOR EACH ROW EXECUTE FUNCTION update_recommendation_analytics();

-- Create unique constraint for recommendation analytics
ALTER TABLE recommendation_analytics ADD CONSTRAINT unique_field_learning_path 
    UNIQUE (field_id, learning_path_id);

-- Create function to get popular learning paths for a field
CREATE OR REPLACE FUNCTION get_popular_learning_paths(
    p_field_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    learning_path_id UUID,
    learning_path_name VARCHAR,
    total_shown BIGINT,
    total_interested BIGINT,
    conversion_rate DECIMAL,
    average_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ra.learning_path_id,
        lp.name,
        ra.total_shown,
        ra.total_interested,
        ra.conversion_rate,
        ra.average_score
    FROM recommendation_analytics ra
    JOIN learning_paths lp ON ra.learning_path_id = lp.id
    WHERE ra.field_id = p_field_id
        AND ra.total_shown >= 3 -- Only include paths with sufficient data
    ORDER BY 
        ra.conversion_rate DESC,
        ra.total_interested DESC,
        ra.average_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user interests for a session
CREATE OR REPLACE FUNCTION get_user_interests(
    p_session_id VARCHAR
)
RETURNS TABLE (
    interest_topic VARCHAR,
    total_weight DECIMAL,
    total_mentions BIGINT,
    last_mentioned TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uit.interest_topic,
        SUM(uit.interest_weight) as total_weight,
        SUM(uit.mentions) as total_mentions,
        MAX(uit.last_mentioned) as last_mentioned
    FROM user_interest_tracking uit
    WHERE uit.session_id = p_session_id
    GROUP BY uit.interest_topic
    ORDER BY total_weight DESC, total_mentions DESC;
END;
$$ LANGUAGE plpgsql;