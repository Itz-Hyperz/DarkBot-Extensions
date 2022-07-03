module.exports = async function(client, con, app) {

  client.darkbot.on('apiReady', function() {

    app.get('/ticket/:id', (req, res) => {
        let dir = __dirname.replace('extensions', "")
        let fileExists = fs.existsSync(dir + `utils/tickets/${req.params.id}`);
        if (fileExists === false) return res.status(404).send({ status: 404, errors: [ "File not Found" ] })
        res.sendFile(dir + `utils/tickets/${req.params.id}`)
    })
  })
  // It ain't much, but its honest work
};
