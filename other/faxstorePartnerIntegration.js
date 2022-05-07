// Put this extension in your FaxStore Extensions folder.

module.exports = function(app, con) {
    app.get('/api/darkbot/partners', async function (req, res) {
        await con.query("SELECT * FROM partners", async (err, row) => {
            if(err) throw err;
            if(!row[0]) {
                let json_ = [];
                res.type('json').send(JSON.stringify(json_, null, 4) + '\n');
            } else {
                let json_ = row;
                res.type('json').send(JSON.stringify(json_, null, 4) + '\n');
            };
        });
    });
};

// Extension made by Hyperz#0001
// Extension made by Hyperz#0001
// Extension made by Hyperz#0001
