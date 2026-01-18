import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/std@0.203.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || "";
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchEvolutionInstances() {
  console.log("📡 Buscando instâncias na Evolution API...");
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        method: "GET",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erro na API Evolution: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.map((inst: any) => inst.instance.instanceName);
  } catch (error) {
    console.error("❌ Falha ao buscar instâncias do Evolution:", error.message);
    return [];
  }
}

async function fetchWorkspaces() {
  console.log("🗄️ Buscando workspaces no Supabase...");
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, instance_name, owner_id");

  if (error) {
    console.error("❌ Erro ao buscar workspaces:", error.message);
    return [];
  }
  return data;
}

async function bindInstances() {
  console.log("🔗 Iniciando Verificação de Vínculo (Binding)...");

  const evoInstances = await fetchEvolutionInstances();
  const workspaces = await fetchWorkspaces();

  console.log(`\n📊 Resumo:`);
  console.log(`- Instâncias no Evolution: ${evoInstances.length}`);
  console.log(`- Workspaces no Supabase: ${workspaces.length}`);

  console.log("\n🔍 Verificando integridade...");

  const orphans = [];
  const unboundWorkspaces = [];
  const boundCorrectly = [];

  // Check Evolution Instances -> Workspaces
  for (const instanceName of evoInstances) {
    const match = workspaces.find((w) => w.instance_name === instanceName);
    if (match) {
      boundCorrectly.push({
        instance: instanceName,
        workspace: match.name,
        id: match.id,
      });
    } else {
      orphans.push(instanceName);
    }
  }

  // Check Workspaces -> Evolution Instances
  for (const ws of workspaces) {
    if (!ws.instance_name) {
      unboundWorkspaces.push({
        name: ws.name,
        id: ws.id,
        reason: "instance_name vazio",
      });
    } else if (!evoInstances.includes(ws.instance_name)) {
      unboundWorkspaces.push({
        name: ws.name,
        id: ws.id,
        reason: `Instância '${ws.instance_name}' não existe no Evolution`,
      });
    }
  }

  console.log("\n✅ VÍNCULOS CORRETOS:");
  if (boundCorrectly.length === 0) console.log("   (Nenhum)");
  boundCorrectly.forEach((b) =>
    console.log(`   [OK] ${b.instance} -> Workspace: ${b.workspace} (${b.id})`)
  );

  console.log("\n⚠️  INSTÂNCIAS ÓRFÃS (Existem no Whats mas sem Workspace):");
  if (orphans.length === 0) console.log("   (Nenhuma)");
  orphans.forEach((inst) =>
    console.log(`   [!] ${inst} -> Precisa criar/vincular um workspace!`)
  );

  console.log("\n❌ WORKSPACES DESCONECTADOS (Problema de Configuração):");
  if (unboundWorkspaces.length === 0) console.log("   (Nenhum)");
  unboundWorkspaces.forEach((ws) =>
    console.log(`   [x] ${ws.name} (${ws.id}) -> ${ws.reason}`)
  );

  console.log(
    "\n💡 DICA: Para corrigir, edite a tabela 'workspaces' no Supabase e coloque o nome exato da instância na coluna 'instance_name'."
  );
}

bindInstances();
