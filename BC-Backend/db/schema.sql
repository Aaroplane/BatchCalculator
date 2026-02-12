DROP DATABASE IF EXISTS batch_calculator_db;
CREATE DATABASE batch_calculator_db;
\c batch_calculator_db;

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  inci_name VARCHAR(255),
  origin VARCHAR(255),
  ingredient_type VARCHAR(100),
  
  -- Property flags (Boolean for easy filtering)
  is_humectant BOOLEAN DEFAULT false,
  is_emollient BOOLEAN DEFAULT false,
  is_occlusive BOOLEAN DEFAULT false,
  is_moisturizing BOOLEAN DEFAULT false,
  is_anhydrous BOOLEAN DEFAULT false,
  
  ph_min DECIMAL(3,1),
  ph_max DECIMAL(3,1),
  solubility VARCHAR(50), 
  max_usage_rate DECIMAL(5,2),
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Uniqueness: one entry per name when origin is unknown,
-- one entry per name+origin combination when origin is known
CREATE UNIQUE INDEX idx_ingredients_name_null_origin ON ingredients(name) WHERE origin IS NULL;
CREATE UNIQUE INDEX idx_ingredients_name_origin ON ingredients(name, origin) WHERE origin IS NOT NULL;

-- Indexes for common queries
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_is_humectant ON ingredients(is_humectant) WHERE is_humectant = true;
CREATE INDEX idx_ingredients_is_emollient ON ingredients(is_emollient) WHERE is_emollient = true;
CREATE INDEX idx_ingredients_is_occlusive ON ingredients(is_occlusive) WHERE is_occlusive = true;

CREATE TABLE formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  base_batch_size DECIMAL(10,2) NOT NULL, 
  unit VARCHAR(10) DEFAULT 'g',
  
  status VARCHAR(20) DEFAULT 'testing',
  version_number INTEGER DEFAULT 1,
  parent_formulation_id UUID REFERENCES formulations(id) ON DELETE SET NULL,
  
  phases TEXT, 
  instructions TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (
    status IN ('testing', 'finalized', 'freeze', 'archived', 'discontinued')
  ),
  CONSTRAINT positive_batch_size CHECK (base_batch_size > 0)
);

-- Indexes
CREATE INDEX idx_formulations_status ON formulations(status);
CREATE INDEX idx_formulations_name ON formulations(name);
CREATE INDEX idx_formulations_parent ON formulations(parent_formulation_id);
CREATE INDEX idx_formulations_created_at ON formulations(created_at DESC);

CREATE TABLE formulation_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulation_id UUID NOT NULL REFERENCES formulations(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  
  percentage DECIMAL(5,2) NOT NULL,
  phase VARCHAR(50),
  sort_order INTEGER DEFAULT 0, 
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_percentage CHECK (percentage > 0 AND percentage <= 100),
  CONSTRAINT unique_ingredient_per_formulation UNIQUE(formulation_id, ingredient_id)
);

CREATE INDEX idx_formulation_ingredients_formulation ON formulation_ingredients(formulation_id);
CREATE INDEX idx_formulation_ingredients_ingredient ON formulation_ingredients(ingredient_id);

CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulation_id UUID NOT NULL REFERENCES formulations(id) ON DELETE RESTRICT,
  
  batch_name VARCHAR(255), 
  target_amount DECIMAL(10,2) NOT NULL,
  actual_amount DECIMAL(10,2),
  unit VARCHAR(10) DEFAULT 'g',
  
  production_date DATE DEFAULT CURRENT_DATE,
  notes TEXT, 
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_target CHECK (target_amount > 0)
);

-- Indexes
CREATE INDEX idx_production_batches_formulation ON production_batches(formulation_id);
CREATE INDEX idx_production_batches_date ON production_batches(production_date DESC);
CREATE INDEX idx_production_batches_created ON production_batches(created_at DESC);

CREATE TABLE batch_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  
  planned_amount DECIMAL(10,2) NOT NULL, 
  actual_amount DECIMAL(10,2),
  unit VARCHAR(10) DEFAULT 'g',
  notes TEXT, 
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_ingredient_per_batch UNIQUE(batch_id, ingredient_id),
  CONSTRAINT positive_planned CHECK (planned_amount > 0)
);

-- Indexes
CREATE INDEX idx_batch_ingredients_batch ON batch_ingredients(batch_id);
CREATE INDEX idx_batch_ingredients_ingredient ON batch_ingredients(ingredient_id);