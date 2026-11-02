CREATE DATABASE IF NOT EXISTS fitness_planner;
USE fitness_planner;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  height_cm DECIMAL(5,1),
  birth_date DATE,
  units ENUM('metric','imperial') DEFAULT 'metric',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user_id NULL = built-in exercise, otherwise user-created
CREATE TABLE exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  muscle_group VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  performed_on DATE NOT NULL,
  duration_min INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, performed_on)
);

CREATE TABLE workout_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workout_id INT NOT NULL,
  exercise_id INT NOT NULL,
  set_number INT NOT NULL,
  reps INT,
  weight_kg DECIMAL(6,2),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE body_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recorded_on DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,1),
  UNIQUE KEY uniq_user_day (user_id, recorded_on),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('weight','lift','workouts_per_week') NOT NULL,
  target_value DECIMAL(7,2) NOT NULL,
  target_date DATE,
  achieved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);