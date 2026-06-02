// ═══════════════════════════════════════════════════════════════
//  CredVision — Google Apps Script | Code.gs
//
//  INSTRUÇÕES:
//  1. Abra a planilha → Extensões → Apps Script
//  2. Apague tudo e cole este arquivo como Código.gs
//  3. Crie um novo arquivo HTML: "+" → HTML → nomeie "index"
//  4. Cole o conteúdo de CredVision_index.html no arquivo index
//  5. Salve tudo (Ctrl+S)
//  6. Implantar → Nova implantação → App da Web
//     Executar como: Eu mesmo | Acesso: Qualquer pessoa
//  7. Copie a URL e abra no navegador
//
//  PÁGINA DE ASSINATURA (WhatsApp):
//  8. Siga o guia do arquivo COMO_CONFIGURAR.md para criar o
//     GitHub Pages e hospedar o sign_githubpages.html
//  9. Após configurar, altere SIGN_PAGE_URL abaixo
// ═══════════════════════════════════════════════════════════════

// ── URL da página de assinatura no GitHub Pages ───────────────
// Após criar o GitHub Pages, altere esta linha com a sua URL:
var SIGN_PAGE_URL = "https://SEU_USUARIO.github.io/cv-sign/sign.html";

// ── Serve a interface ────────────────────────────────────────
// Quando há ?sign=ID na URL (link enviado pelo WhatsApp), serve a
// página LEVE de assinatura (sign.html) usando createTemplateFromFile.
//
// Diferença chave vs tentativas anteriores:
//   createTemplateFromFile injeta os dados DENTRO do HTML no servidor
//   (via <?= loanId ?> e <?= loanData ?>), ANTES de qualquer redirect
//   ou execução de JavaScript no cliente. Não depende de URL params,
//   window variables, append() ou qualquer coisa que possa ser perdida.
function doGet(e) {
  if (e && e.parameter && e.parameter.sign) {
    var signId = String(e.parameter.sign).replace(/[^a-z0-9_\-]/gi, '');

    // Busca dados do empréstimo no servidor
    var loanJson = 'null';
    try {
      var res = getLoan(signId);
      if (res.ok && res.data) {
        var clean = JSON.parse(JSON.stringify(res.data));
        delete clean.signature; // não precisa da imagem no link
        loanJson = JSON.stringify(clean);
      }
    } catch(ex) { /* loanJson permanece 'null' */ }

    // createTemplateFromFile substitui <?= loanId ?> e <?= loanData ?>
    // diretamente no HTML antes de entregar ao cliente
    var tmpl = HtmlService.createTemplateFromFile('sign');
    tmpl.loanId   = signId;
    tmpl.loanData = loanJson;

    return tmpl.evaluate()
      .setTitle('Assinar Contrato — CredVision')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // ── App principal ──
  // Injeta a URL correta do exec no HTML para que a página
  // de assinatura saiba para onde enviar a assinatura
  var mainOut = HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CredVision — Sistema de Cobrança')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  try {
    var execUrl = ScriptApp.getService().getUrl();
    mainOut.append('<script>window.__GAS_EXEC_URL__="' + execUrl + '";</script>');
  } catch(ex) { /* continua sem a URL injetada */ }
  return mainOut;
}

// ── doPost: aceita chamadas do GitHub Pages (fetch no-cors) ──
// A página de assinatura externa envia Content-Type: text/plain
// com JSON no corpo. GAS recebe via e.postData.contents.
function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var d    = JSON.parse(body);
    var out  = ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);

    if (d.action === 'saveSignature' && d.loanId && d.signature) {
      var r = saveSignature(d.loanId, d.signature);
      out.setContent(JSON.stringify(r));
    }
    return out;
  } catch(ex) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:ex.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Funções chamadas pela página de assinatura ───────────────

// Retorna dados de um empréstimo pelo ID (para a sign.html)
function getLoan(loanId) {
  try {
    var res = getData();
    if (!res.ok) return { ok: false, error: res.error };
    var loan = (res.data.loans || []).find(function(l) { return l.id === loanId; });
    if (!loan) return { ok: false, error: 'Empréstimo não encontrado.' };
    return { ok: true, data: loan };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// Salva a assinatura digital em um empréstimo
function saveSignature(loanId, signatureBase64) {
  try {
    var res = getData();
    if (!res.ok) return { ok: false, error: res.error };
    var data   = res.data;
    var loans  = data.loans   || [];
    var found  = false;

    loans = loans.map(function(l) {
      if (l.id === loanId) {
        found = true;
        l.signature   = signatureBase64;
        l.signedAt    = new Date().toISOString();
      }
      return l;
    });

    if (!found) return { ok: false, error: 'Empréstimo ' + loanId + ' não encontrado.' };

    data.loans = loans;
    var saveRes = saveData(JSON.stringify(data));
    return saveRes;
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ── Aba de dados brutos ──────────────────────────────────────
// Cada tipo fica em uma célula separada para não estourar o
// limite de 50.000 caracteres por célula do Google Sheets.
// A1 = loans (sem assinatura)
// A2 = clients (sem fotos)
// A3 = users
// A4 = assinaturas (base64) separadas por loanId
// A5 = fotos de clientes (base64) separadas por clientId
function getSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CV_Data');
  if (!sheet) {
    sheet = ss.insertSheet('CV_Data');
    // Cabeçalhos para facilitar leitura direta na planilha
    sheet.getRange('B1:F1').setValues([['loans','clients','users','signatures','photos']]);
    sheet.getRange('B1:F1').setFontWeight('bold').setFontColor('#C9A448').setBackground('#0d0d0d');
    ['A1','A2','A3','A4','A5'].forEach(function(c){ sheet.getRange(c).setValue('[]'); });
  }
  return sheet;
}

// ── Lê dados e reconstrói assinaturas/fotos ──────────────────
function getData() {
  try {
    var sh = getSheet();
    var loans   = JSON.parse(String(sh.getRange('A1').getValue() || '[]'));
    var clients = JSON.parse(String(sh.getRange('A2').getValue() || '[]'));
    var users   = JSON.parse(String(sh.getRange('A3').getValue() || '[]'));
    var sigs    = JSON.parse(String(sh.getRange('A4').getValue() || '{}'));
    var photos  = JSON.parse(String(sh.getRange('A5').getValue() || '{}'));

    // Reanexa assinaturas aos empréstimos
    loans.forEach(function(l) {
      if (sigs[l.id]) l.signature = sigs[l.id];
    });
    // Reanexa fotos aos clientes (campo é c.fotos no sistema)
    clients.forEach(function(c) {
      if (photos[c.id]) c.fotos = photos[c.id];
    });

    return { ok: true, data: { loans: loans, clients: clients, users: users } };
  } catch(e) {
    return { ok: false, error: 'getData: ' + e.message };
  }
}

// ── Salva dados ──────────────────────────────────────────────
function saveData(payloadStr) {
  try {
    var data = JSON.parse(payloadStr);

    // ── Extrai assinaturas (podem ser grandes base64) ──
    var sigs = {};
    var loansClean = (data.loans || []).map(function(l) {
      var lc = copyObj(l);
      if (lc.signature) { sigs[lc.id] = lc.signature; delete lc.signature; }
      return lc;
    });

    // ── Extrai fotos de clientes (campo real: c.fotos = { slotId: base64 }) ──
    var photos = {};
    var clientsClean = (data.clients || []).map(function(c) {
      var cc = copyObj(c);
      if (cc.fotos && Object.keys(cc.fotos).length) {
        photos[cc.id] = cc.fotos;
        delete cc.fotos;
      }
      return cc;
    });

    var sh = getSheet();
    sh.getRange('A1').setValue(JSON.stringify(loansClean));
    sh.getRange('A2').setValue(JSON.stringify(clientsClean));
    sh.getRange('A3').setValue(JSON.stringify(data.users || []));
    sh.getRange('A4').setValue(JSON.stringify(sigs));
    sh.getRange('A5').setValue(JSON.stringify(photos));

    // ── writeFormattedSheets NÃO é chamado aqui ──────────────
    // Reescrever 4 abas + autoResize leva 10-20s por save.
    // Use syncPlanilhas() manualmente quando quiser atualizar.

    return { ok: true };
  } catch(e) {
    return { ok: false, error: 'saveData: ' + e.message };
  }
}

// ── Atualiza abas formatadas (chamado pelo botão no app) ──────
function syncPlanilhas() {
  try {
    var res = getData();
    if (!res.ok) return { ok: false, error: res.error };
    writeFormattedSheets(res.data);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// Cópia rasa de objeto (evita referências)
function copyObj(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ── Escreve abas formatadas ──────────────────────────────────
function writeFormattedSheets(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── EMPRÉSTIMOS ──
  var loanRows = [];
  (data.loans || []).forEach(function(l) {
    try {
      var paid     = 0;
      var installs = l.installments || [];
      var allPaid  = installs.length > 0 && installs.every(function(p){ return p.status === 'paid'; });
      var anyOver  = installs.some(function(p){ return p.status === 'overdue'; });
      var status   = allPaid ? 'Quitado' : anyOver ? 'Em atraso' : 'Pendente';

      installs.forEach(function(p) {
        if (p.status === 'paid') paid += parseFloat(p.paidAmount) || 0;
        (p.interestPayments || []).forEach(function(ip){ paid += parseFloat(ip.amount) || 0; });
      });

      loanRows.push([
        String(l.debtor      || ''),
        String(l.phone       || ''),
        parseFloat(l.totalAmount)  || 0,
        parseFloat(paid)           || 0,
        parseFloat(Math.max(0, (l.totalAmount||0) - paid)) || 0,
        parseInt(installs.length)  || 0,
        parseFloat(l.interestRate) || 0,
        String(l.loanDate    || ''),
        String(status),
        String(l.obs         || ''),
        l.signature ? 'Sim' : 'Não'
      ]);
    } catch(e) { /* pula linha com erro */ }
  });
  writeSheet(ss, 'Emprestimos',
    ['Devedor','Telefone','Valor Total','Pago','Saldo','Parcelas','Juros %','Data','Status','Observações','Assinatura'],
    loanRows
  );

  // ── PARCELAS ──
  var parcRows = [];
  (data.loans || []).forEach(function(l) {
    (l.installments || []).forEach(function(p) {
      try {
        parcRows.push([
          String(l.debtor    || ''),
          parseInt(p.num)    || 0,
          String(p.dueDate   || ''),
          parseFloat(p.amount)    || 0,
          String(p.status    || ''),
          String(p.paidDate  || ''),
          parseFloat(p.paidAmount) || 0
        ]);
      } catch(e) { /* pula */ }
    });
  });
  writeSheet(ss, 'Parcelas',
    ['Devedor','Nº','Vencimento','Valor','Status','Data Pgto','Valor Pago'],
    parcRows
  );

  // ── CLIENTES ──
  var cliRows = (data.clients || []).map(function(c) {
    return [
      String(c.nome      || ''),
      String(c.cpf       || ''),
      String(c.tel       || ''),
      String(c.endereco  || ''),
      String(c.email     || ''),
      String(c.createdAt || ''),
      (c.fotos && Object.keys(c.fotos).length) ? Object.keys(c.fotos).length + ' foto(s)' : 'Sem fotos'
    ];
  });
  writeSheet(ss, 'Clientes',
    ['Nome','CPF','Telefone','Endereço','Email','Cadastro','Fotos'],
    cliRows
  );

  // ── USUÁRIOS ──
  var userRows = (data.users || []).map(function(u) {
    return [String(u.login||''), String(u.pass||''), String(u.role||'user')];
  });
  writeSheet(ss, 'Usuarios',
    ['Login','Senha','Perfil'],
    userRows
  );
}

// ── Helper: cria/atualiza aba formatada ──────────────────────
function writeSheet(ss, name, headers, rows) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  // Limpa linhas de dados mantendo cabeçalho
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

  // Cabeçalho
  var hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setValues([headers])
        .setFontWeight('bold')
        .setBackground('#0d0d0d')
        .setFontColor('#C9A448');
  sheet.setFrozenRows(1);

  // Dados
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // Formata colunas de valor
    headers.forEach(function(h, i) {
      var col = i + 1;
      var isMoney = (h === 'Valor Total' || h === 'Pago' || h === 'Saldo'
                  || h === 'Valor'       || h === 'Valor Pago');
      if (isMoney) sheet.getRange(2, col, rows.length, 1).setNumberFormat('R$ #,##0.00');
      if (h === 'Juros %') sheet.getRange(2, col, rows.length, 1).setNumberFormat('0.00"%"');
    });

    // Cor condicional na coluna Status (Empréstimos)
    var stIdx = headers.indexOf('Status');
    if (stIdx >= 0) {
      rows.forEach(function(row, ri) {
        var cell = sheet.getRange(ri + 2, stIdx + 1);
        if (row[stIdx] === 'Quitado')   cell.setFontColor('#4CAF7D');
        else if (row[stIdx] === 'Em atraso') cell.setFontColor('#E05A3A');
        else                            cell.setFontColor('#C9A448');
      });
    }
  }

  // autoResizeColumns removido — era a operação mais lenta (~2s por aba)
}
