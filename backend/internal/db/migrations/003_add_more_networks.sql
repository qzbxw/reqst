DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'network' AND e.enumlabel = 'SOLANA'
  ) THEN
    ALTER TYPE network ADD VALUE 'SOLANA';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'network' AND e.enumlabel = 'BASE'
  ) THEN
    ALTER TYPE network ADD VALUE 'BASE';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'network' AND e.enumlabel = 'ARBITRUM'
  ) THEN
    ALTER TYPE network ADD VALUE 'ARBITRUM';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'network' AND e.enumlabel = 'BSC'
  ) THEN
    ALTER TYPE network ADD VALUE 'BSC';
  END IF;
END $$;
