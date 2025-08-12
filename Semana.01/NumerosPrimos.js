// Retorna true se for número primo
function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// Lista os primos até um valor
function listarPrimos(limite) {
    for (let i = 2; i <= limite; i++) {
        if (isPrime(i)) console.log(i);
    }
}

listarPrimos(50); // Primos até 50
