import pg from 'pg';
const pool = new pg.Pool({
    user: 'madcoins',
    password: '0500794',
    host: '192.168.88.88',
    port: 5432,
    database: 'madcoins'
});
export { pool };
//# sourceMappingURL=db.js.map