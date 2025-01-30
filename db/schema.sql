-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects in correct order
DROP VIEW IF EXISTS dataset_statistics;
DROP TRIGGER IF EXISTS set_timestamp ON datasets;
DROP FUNCTION IF EXISTS trigger_set_timestamp();
DROP INDEX IF EXISTS idx_datasets_user_id;
DROP INDEX IF EXISTS idx_datasets_share_token;
DROP INDEX IF EXISTS idx_fit_files_dataset_id;
DROP INDEX IF EXISTS idx_datasets_created_at;
DROP INDEX IF EXISTS idx_fit_files_created_at;
DROP INDEX IF EXISTS idx_dataset_statistics;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  -- Firebase UID
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  share_token TEXT UNIQUE,  -- Unique constraint for share tokens
  CONSTRAINT valid_name CHECK (length(trim(name)) > 0)  -- Ensure name is not empty
);

-- Create fit_files table
CREATE TABLE IF NOT EXISTS fit_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT valid_file_name CHECK (length(trim(name)) > 0),  -- Ensure file name is not empty
  CONSTRAINT valid_file_path CHECK (length(trim(file_path)) > 0)  -- Ensure file path is not empty
);

-- Create indexes for better query performance
DROP INDEX IF EXISTS idx_datasets_user_id;
CREATE INDEX idx_datasets_user_id ON datasets(user_id);

DROP INDEX IF EXISTS idx_datasets_share_token;
CREATE INDEX idx_datasets_share_token ON datasets(share_token);

DROP INDEX IF EXISTS idx_fit_files_dataset_id;
CREATE INDEX idx_fit_files_dataset_id ON fit_files(dataset_id);

DROP INDEX IF EXISTS idx_datasets_created_at;
CREATE INDEX idx_datasets_created_at ON datasets(created_at DESC);

DROP INDEX IF EXISTS idx_fit_files_created_at;
CREATE INDEX idx_fit_files_created_at ON fit_files(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS set_timestamp ON datasets;
CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user information from Firebase authentication';
COMMENT ON TABLE datasets IS 'Stores collections of FIT files for analysis';
COMMENT ON TABLE fit_files IS 'Stores individual FIT file information and paths';

COMMENT ON COLUMN datasets.share_token IS 'Unique token for sharing datasets with non-authenticated users';
COMMENT ON COLUMN fit_files.file_path IS 'Path to the stored FIT file in the file system';

-- Create view for quick access to dataset statistics
DROP VIEW IF EXISTS dataset_statistics;
CREATE VIEW dataset_statistics AS
SELECT 
  d.id AS dataset_id,
  d.name AS dataset_name,
  d.user_id,
  COUNT(f.id) AS file_count,
  MIN(f.created_at) AS oldest_file,
  MAX(f.created_at) AS newest_file
FROM datasets d
LEFT JOIN fit_files f ON d.id = f.dataset_id
GROUP BY d.id, d.name, d.user_id;

-- Add indexes to support the view
DROP INDEX IF EXISTS idx_dataset_statistics;
CREATE INDEX idx_dataset_statistics ON datasets(id, name, user_id);