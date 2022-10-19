const asyncForeach = (arr: Array<any>, fn:(a) => void, i: number = 0) => {
    new Promise(async (resolve, reject) => {
        resolve(await fn(arr[i]));
    }).then(result => {
        if(i + 1 < arr.length) {
            asyncForeach(arr, fn, ++i);
        }
    });
}

export default asyncForeach;
