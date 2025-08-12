/*
   Jogo de adivinhação terminal — Node.js
 
   Recursos:
   - Dificuldades (fácil / normal / difícil / custom)
   - Contagem de tentativas e limite por dificuldade
   - Dicas progressivas (paridade, intervalo, proximidade)
   - Persistência opcional de resultados em scores.json
   - Opção de executá-lo com '--no-save' para não salvar histórico
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { performance } = require('perf_hooks');

const args = process.argv.slice(2);
const NO_SAVE = args.includes('no-save'); // rodar: node jogo
const SCORES_FILE = path.join(__dirname, 'scores.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// util: pergunta que retorna Promise (async/await)
function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

// util: carregar scores (se existir)
function loadScores() {
  try {
    const raw = fs.readFileSync(SCORES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return []; // arquivo não existe ou inválido -> retorna array vazio
  }
}

// util: salvar scores (sobrescreve)
function saveScores(scores) {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar scores:', err.message);
  }
}

// gera número aleatório entre min e max (inclusive)
function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// formata tempo em mm:ss
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// mostra scoreboard (top 5: menos tentativas, menor tempo)
function showTop(scores, top = 5) {
  if (!scores || scores.length === 0) {
    console.log('Nenhum registro salvo ainda.');
    return;
  }
  const sorted = [...scores].sort((a, b) => {
    if (a.attempts !== b.attempts) return a.attempts - b.attempts;
    return a.timeMs - b.timeMs;
  });
  console.log('\n--- Top Scores ---');
  sorted.slice(0, top).forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} • ${s.attempts} tentativas • ${formatTime(s.timeMs)} • ${s.difficulty} • ${s.date}`);
  });
}

// loop do jogo (uma partida)
async function playOnce(playerName) {
  console.log('\nEscolha uma dificuldade:');
  console.log('  1) Fácil   (1-50, 12 tentativas)');
  console.log('  2) Normal  (1-100, 10 tentativas)');
  console.log('  3) Difícil (1-500, 8 tentativas)');
  console.log('  4) Custom  (você define intervalo e tentativas)');

  let diffChoice;
  while (true) {
    diffChoice = await ask('Opção [1-4]: ');
    if (['1', '2', '3', '4'].includes(diffChoice)) break;
    console.log('Opção inválida. Digite 1, 2, 3 ou 4.');
  }

  let min = 1, max = 100, maxAttempts = 10, difficultyLabel = 'Normal';
  if (diffChoice === '1') { min = 1; max = 50; maxAttempts = 12; difficultyLabel = 'Fácil'; }
  else if (diffChoice === '2') { min = 1; max = 100; maxAttempts = 10; difficultyLabel = 'Normal'; }
  else if (diffChoice === '3') { min = 1; max = 500; maxAttempts = 8; difficultyLabel = 'Difícil'; }
  else {
    // custom
    while (true) {
      const minStr = await ask('Valor mínimo (inteiro): ');
      const maxStr = await ask('Valor máximo (inteiro, > mínimo): ');
      const attemptsStr = await ask('Máximo de tentativas (inteiro): ');
      const minN = parseInt(minStr, 10), maxN = parseInt(maxStr, 10), attN = parseInt(attemptsStr, 10);
      if (!Number.isNaN(minN) && !Number.isNaN(maxN) && !Number.isNaN(attN) && maxN > minN && attN > 0) {
        min = minN; max = maxN; maxAttempts = attN; difficultyLabel = `Custom (${min}-${max}, ${maxAttempts} tentativas)`;
        break;
      }
      console.log('Valores inválidos. Tente novamente.');
    }
  }

  const secret = randBetween(min, max);
  let attempts = 0;
  const startTime = performance.now();

  console.log(`\nPensei em um número entre ${min} e ${max}. Você tem ${maxAttempts} tentativas.\n(Digite "sair" a qualquer momento para encerrar.)`);

  while (attempts < maxAttempts) {
    const remaining = maxAttempts - attempts;
    const ans = await ask(`Palpite (${remaining} restantes): `);
    if (ans.toLowerCase() === 'sair') {
      console.log('Saindo da partida...');
      return { finished: false };
    }

    const guess = parseInt(ans, 10);
    if (Number.isNaN(guess)) {
      console.log('Digite um número válido.');
      continue;
    }
    if (guess < min || guess > max) {
      console.log(`O palpite precisa estar entre ${min} e ${max}.`);
      continue;
    }

    attempts++;

    if (guess === secret) {
      const elapsed = performance.now() - startTime;
      console.log(`\n Acertou! Número: ${secret}`);
      console.log(`Tentativas: ${attempts} | Tempo: ${formatTime(elapsed)}\n`);
      return {
        finished: true,
        attempts,
        timeMs: Math.round(elapsed),
        name: playerName,
        difficulty: difficultyLabel,
      };
    }

    // dica básica
    if (guess < secret) console.log(' O número é MAIOR.');
    else console.log(' O número é MENOR.');

    // dicas progressivas
    if (attempts === 2) {
      // paridade
      console.log(`Dica: o número é ${secret % 2 === 0 ? 'par' : 'ímpar'}.`);
    } else if (attempts === Math.ceil(maxAttempts / 2)) {
      // intervalo aproximado
      const width = Math.max(5, Math.floor((max - min) / 6)); // largura da janela da dica
      const low = Math.max(min, secret - Math.floor(width / 2));
      const high = Math.min(max, secret + Math.ceil(width / 2));
      console.log(`Dica: está entre ${low} e ${high} (intervalo aproximado).`);
    } else if (attempts === maxAttempts - 1) {
      // última tentativa: proximidade com o último palpite
      const delta = Math.abs(secret - guess);
      if (delta <= 2) console.log('Dica final: Está MUITO PERTO (diferença <= 2).');
      else if (delta <= 5) console.log('Dica final: Está Perto (diferença <= 5).');
      else console.log('Dica final: Ainda está longe — pense maior/menor conforme indicado.');
    }
  }

  console.log(`\n Suas tentativas acabaram. O número era ${secret}.`);
  return { finished: false, attempts: maxAttempts, name: playerName, difficulty: difficultyLabel };
}

// fluxo principal
(async function main() {
  console.log('Jogo de Adivinhação Avançado');

  const playerNameInput = await ask('Nome do jogador (ou pressione Enter para "Anônimo"): ');
  const playerName = playerNameInput || 'Anônimo';

  const scores = loadScores();

  while (true) {
    const result = await playOnce(playerName);

    if (result && result.finished) {
      // salvar resultado se permitido
      if (!NO_SAVE) {
        scores.push({
          name: result.name,
          attempts: result.attempts,
          timeMs: result.timeMs,
          difficulty: result.difficulty,
          date: new Date().toISOString(),
        });
        saveScores(scores);
        console.log('Resultado salvo em scores.json.');
      } else {
        console.log('Resultado NÃO salvo (--no-save).');
      }
      showTop(scores, 5);
    } else if (result && !result.finished) {
      // partida terminada sem vitória (usuário saiu ou perdeu)
      if (result.attempts && !NO_SAVE) {
        // registrar derrota parcial (opcional)
        scores.push({
          name: result.name || playerName,
          attempts: result.attempts,
          timeMs: 0,
          difficulty: result.difficulty || 'N/A',
          date: new Date().toISOString(),
          note: 'derrota/saída',
        });
        saveScores(scores);
      }
    }

    const again = await ask('\nDeseja jogar novamente? (s/n): ');
    if (again.toLowerCase().startsWith('s')) {
      continue;
    } else {
      console.log('\nObrigado por jogar. Até a próxima.');
      rl.close();
      break;
    }
  }
})();
