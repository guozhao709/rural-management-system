CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  gender TINYINT DEFAULT 0,
  birthday DATE,
  address VARCHAR(255),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crop_analysis (
  id INT NOT NULL AUTO_INCREMENT,
  crop_name VARCHAR(100) NOT NULL,
  region VARCHAR(255) NOT NULL,
  analysis_text LONGTEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_crop_analysis_crop_region (crop_name, region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_analysis (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  basic_info LONGTEXT NOT NULL,
  symptoms LONGTEXT NOT NULL,
  habits LONGTEXT NOT NULL,
  medical_history LONGTEXT NOT NULL,
  analysis_json LONGTEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_health_analysis_user_id (user_id),
  INDEX idx_health_analysis_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agriculture_knowledge (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  tags TEXT,
  source VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_agriculture_knowledge_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS health_knowledge (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  tags TEXT,
  source VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_health_knowledge_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversations (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  last_message TEXT,
  last_message_time DATETIME,
  unread_count INT NOT NULL DEFAULT 0,
  is_admin_read TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_conversations_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT NOT NULL AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_type VARCHAR(32) NOT NULL,
  message_type VARCHAR(32) NOT NULL DEFAULT 'text',
  content LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS article (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content LONGTEXT NOT NULL,
  cover VARCHAR(500) DEFAULT '',
  category VARCHAR(100) DEFAULT '',
  is_banner TINYINT NOT NULL DEFAULT 0,
  is_top TINYINT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_article_status (status),
  INDEX idx_article_category (category),
  INDEX idx_article_is_banner (is_banner),
  INDEX idx_article_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
