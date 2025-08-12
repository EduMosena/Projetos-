function somaArray(arr) {
    return arr.reduce((acc, valor) => acc + valor, 0);
}

console.log(somaArray([1, 2, 3, 4, 5])); // 15
