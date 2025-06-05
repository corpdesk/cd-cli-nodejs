use cd1213;
-- TABLE: cd_ai_type
CREATE TABLE `cd_ai_type` (
  `cd_ai_type_id` INT NOT NULL AUTO_INCREMENT,
  `cd_ai_type_guid` VARCHAR(40) DEFAULT NULL,
  `cd_ai_type_name` VARCHAR(60) DEFAULT NULL,          -- e.g., OpenAI
  `cd_ai_type_description` VARCHAR(200) DEFAULT NULL,  -- e.g., OpenAI GPT Services
  `doc_id` INT DEFAULT NULL,
  `cd_ai_type_data` JSON DEFAULT NULL,                 -- Holds keys like endpoint, pricing, models
  PRIMARY KEY (`cd_ai_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- TABLE: cd_ai_usage_log
CREATE TABLE `cd_ai_usage_log` (
  `cd_ai_usage_log_id` INT NOT NULL AUTO_INCREMENT,
  `cd_ai_usage_log_guid` VARCHAR(40) DEFAULT NULL,
  `cd_ai_usage_log_name` VARCHAR(100) DEFAULT NULL,
  `cd_ai_usage_log_description` VARCHAR(255) DEFAULT NULL,
  `doc_id` INT DEFAULT NULL,

  `user_id` INT DEFAULT NULL,
  `cd_ai_usage_log_data` JSON DEFAULT NULL,

  `cd_ai_type_id` INT DEFAULT NULL,
  `cd_ai_type_guid` VARCHAR(40) DEFAULT NULL,

  `model_name` VARCHAR(50) DEFAULT NULL,
  `service_type` VARCHAR(30) DEFAULT NULL,
  `prompt_tokens` INT DEFAULT 0,
  `completion_tokens` INT DEFAULT 0,
  `total_tokens` INT DEFAULT 0,
  `estimated_cost_usd` DECIMAL(10,4) DEFAULT 0.0000,

  `cd_ai_usage_log_created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cd_ai_usage_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- OPENAI
INSERT INTO `cd_ai_type` (
  `cd_ai_type_guid`, `cd_ai_type_name`, `cd_ai_type_description`, `doc_id`, `cd_ai_type_data`
) VALUES (
  UUID(), 'OpenAI', 'OpenAI GPT Services', NULL,
  JSON_OBJECT(
    'endpoint', 'https://api.openai.com/v1/chat/completions',
    'api_key_env', 'OPEN_AI_API_KEY',
    'service_type', 'chat',
    'models', JSON_ARRAY(
      JSON_OBJECT('name', 'gpt-4', 'description', 'GPT-4 standard model'),
      JSON_OBJECT('name', 'gpt-3.5-turbo', 'description', 'GPT-3.5 turbo version')
    ),
    'pricing', JSON_ARRAY(
      JSON_OBJECT('model', 'gpt-4', 'prompt_cost_per_1k', 0.03, 'completion_cost_per_1k', 0.06),
      JSON_OBJECT('model', 'gpt-3.5-turbo', 'prompt_cost_per_1k', 0.0015, 'completion_cost_per_1k', 0.002)
    )
  )
);

-- DEEPSEEK
INSERT INTO `cd_ai_type` (
  `cd_ai_type_guid`, `cd_ai_type_name`, `cd_ai_type_description`, `doc_id`, `cd_ai_type_data`
) VALUES (
  UUID(), 'DeepSeek', 'DeepSeek LLM Services', NULL,
  JSON_OBJECT(
    'endpoint', 'https://api.deepseek.com/v1/chat/completions',
    'api_key_env', 'DEEPSEEK_API_KEY',
    'service_type', 'chat',
    'models', JSON_ARRAY(
      JSON_OBJECT('name', 'deepseek-chat', 'description', 'DeepSeek Chat Model'),
      JSON_OBJECT('name', 'deepseek-coder', 'description', 'DeepSeek Coder Model')
    ),
    'pricing', JSON_ARRAY(
      JSON_OBJECT('model', 'deepseek-chat', 'prompt_cost_per_1k', 0.002, 'completion_cost_per_1k', 0.002),
      JSON_OBJECT('model', 'deepseek-coder', 'prompt_cost_per_1k', 0.002, 'completion_cost_per_1k', 0.002)
    )
  )
);

-- GEMINI (GOOGLE)
INSERT INTO `cd_ai_type` (
  `cd_ai_type_guid`, `cd_ai_type_name`, `cd_ai_type_description`, `doc_id`, `cd_ai_type_data`
) VALUES (
  UUID(), 'Gemini', 'Gemini by Google (Generative Language)', NULL,
  JSON_OBJECT(
    'endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    'api_key_env', 'GEMINI_API_KEY',
    'service_type', 'chat',
    'models', JSON_ARRAY(
      JSON_OBJECT('name', 'gemini-1.5-flash', 'description', 'Lightweight Gemini model'),
      JSON_OBJECT('name', 'gemini-1.5-pro', 'description', 'Pro Gemini model for more detailed reasoning')
    ),
    'pricing', JSON_ARRAY(
      JSON_OBJECT('model', 'gemini-1.5-flash', 'prompt_cost_per_1k', 0.00025, 'completion_cost_per_1k', 0.0005),
      JSON_OBJECT('model', 'gemini-1.5-pro', 'prompt_cost_per_1k', 0.005, 'completion_cost_per_1k', 0.015)
    )
  )
);