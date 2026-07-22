-- GranChef — Schema do banco de dados
-- Execute no SQL Editor do seu projeto Supabase

-- ─── Perfis de empresa ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresa_perfis (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  telefone  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Transações de caixa ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_transacoes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor      NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  categoria  TEXT NOT NULL,
  descricao  TEXT,
  data       DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS caixa_transacoes_empresa_data
  ON caixa_transacoes (empresa_id, data);

-- ─── Contas fixas ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_contas_fixas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  dia_vencimento  SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  categoria       TEXT NOT NULL DEFAULT 'Outro',
  ativa           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Pagamentos de contas fixas (por mês) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_pagamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_fixa_id   UUID NOT NULL REFERENCES caixa_contas_fixas(id) ON DELETE CASCADE,
  empresa_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano         TEXT NOT NULL,   -- formato 'YYYY-MM'
  pago            BOOLEAN NOT NULL DEFAULT FALSE,
  data_pagamento  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conta_fixa_id, mes_ano)
);

-- ─── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE empresa_perfis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_transacoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_contas_fixas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_pagamentos    ENABLE ROW LEVEL SECURITY;

-- Cada usuário acessa apenas seus próprios dados
CREATE POLICY "empresa_perfis_own" ON empresa_perfis
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "transacoes_own" ON caixa_transacoes
  FOR ALL USING (auth.uid() = empresa_id);

CREATE POLICY "contas_fixas_own" ON caixa_contas_fixas
  FOR ALL USING (auth.uid() = empresa_id);

CREATE POLICY "pagamentos_own" ON caixa_pagamentos
  FOR ALL USING (auth.uid() = empresa_id);
