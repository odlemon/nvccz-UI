CREATE TABLE IF NOT EXISTS asset_register_imports (
  id VARCHAR(191) PRIMARY KEY, source_key VARCHAR(191) NOT NULL UNIQUE,
  asset_id VARCHAR(191) NULL UNIQUE, asset_pool VARCHAR(191) NOT NULL,
  acquisition_date DATETIME(3) NOT NULL, description TEXT NOT NULL,
  cost_per_unit_zig DECIMAL(15,2) NOT NULL, quantity INT NOT NULL,
  total_cost_zig DECIMAL(15,2) NOT NULL, historical_rate DECIMAL(18,6) NOT NULL,
  total_cost_usd DECIMAL(15,2) NOT NULL, supplier VARCHAR(191) NOT NULL,
  useful_life_months INT NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
