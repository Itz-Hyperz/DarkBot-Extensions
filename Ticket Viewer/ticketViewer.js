module.exports = async function(client, con, app) {


  app.get('/ticket/:id', (req, res) => {
      let dir = __dirname.replace('extensions', "")
      res.sendFile(dir + `utils/tickets/${req.params.id}`)
  })

  // It ain't much, but its honest work
};