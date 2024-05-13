import express from 'express';
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/api/loadPromotedContent.php', (req, res) => {
  res.send({})
})

app.get('/api/getQuickCheckSignedIn.php', (req, res) => {
  res.send({})
})

app.get('/api/checkForCommunityAdmin.php', (req, res) => {
  res.send({})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
