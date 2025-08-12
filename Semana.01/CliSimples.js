const readline = require('readline');

let tarefas = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function mostrarMenu() {
    console.log("\n==== Gerenciador de Tarefas ===");
    console.log("1 - Adicionar tarefa");
    console.log("2 - Listar tarefas");
    console.log("3 - Remover tarefa");
    console.log("4 - Sair");

    rl.question("Escolha uma opção: ", (opcao) => {
        switch (opcao) {
            case '1':
                rl.question("Digite a tarefa: ", (tarefa) => {
                    tarefas.push(tarefa);
                    console.log("Tarefa adicionada!");
                    mostrarMenu();
                });
                break;

            case '2':
                console.log("\n--- Lista de Tarefas ---");
                if (tarefas.length === 0) {
                    console.log("Nenhuma tarefa cadastrada.");
                } else {
                    tarefas.forEach((t, i) => console.log(`${i + 1}. ${t}`));
                }
                mostrarMenu();
                break;

            case '3':
                rl.question("Digite o número da tarefa para remover: ", (num) => {
                    const index = parseInt(num) - 1;
                    if (index >= 0 && index < tarefas.length) {
                        console.log(` Tarefa "${tarefas[index]}" removida.`);
                        tarefas.splice(index, 1);
                    } else {
                        console.log("Número inválido.");
                    }
                    mostrarMenu();
                });
                break;

            case '4':
                console.log("Saindo.");
                rl.close();
                break;

            default:
                console.log("Opção inválida!");
                mostrarMenu();
        }
    });
}

mostrarMenu();
