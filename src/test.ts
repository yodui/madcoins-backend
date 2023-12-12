const subs = new Map();

const setName1 = 'setName';
subs.set(setName1, 1);
subs.set(setName1, subs.get(setName1)+2);

console.log(subs);
