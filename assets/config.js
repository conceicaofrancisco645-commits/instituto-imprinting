// Configuração pública do Supabase.
// A chave "publishable" pode ficar no front-end: a tabela "leads" tem RLS
// que só permite INSERIR (ninguém consegue ler os dados com esta chave).
window.IMPRINTING_CONFIG = {
  supabaseUrl: "https://lchayvsgtklfcipnlhec.supabase.co",
  supabaseKey: "sb_publishable_MmzPAtttFAOIaVVvsryk3Q_mIQ_RGaU",
  tabela: "leads"
};
