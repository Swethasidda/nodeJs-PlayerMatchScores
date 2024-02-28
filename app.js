const express = require('express')
const app = express()
const path = require('path')
const dbpath = path.join(__dirname, 'cricketMatchDetails.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null
//INTAILIZATION OF DB AND SERVER
const intailizationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () => {
      console.log('Server is running at http://localhost:3001')
    })
  } catch (e) {
    console.log(`DB ERROR ${e.message}`)
    process.exit(1)
  }
}
intailizationDBAndServer()
app.use(express.json())
//API1
app.get('/players/', async (request, response) => {
  const allPlayers = `
    SELECT *
    FROM player_details;
    `
  const players = await db.all(allPlayers)
  const result = players => {
    return {
      playerId: players.player_id,
      playerName: players.player_name,
    }
  }
  response.send(players.map(each => result(each)))
})
//API2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayer = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `
  const player = await db.get(getPlayer)
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  })
})
//API3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const bodydetails = request.body
  const {playerName} = bodydetails
  const updatePlayer = `
  UPDATE player_details
  SET 
  player_name = '${playerName}'
  WHERE player_id = ${playerId};
  `
  await db.run(updatePlayer)
  response.send('Player Details Updated')
})
//API4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatch = `
  SELECT *
  FROM match_details
  WHERE match_id = ${matchId};
  `
  const match = await db.get(getMatch)
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  })
})
//API5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchesofPlayer = `
  SELECT *
  FROM player_match_score INNER JOIN match_details
  ON player_match_score.match_id = match_details.match_id
  WHERE player_match_score.player_id = ${playerId};
  `
  const getMatches = await db.all(getMatchesofPlayer)
  const result = getMatches => {
    return {
      matchId: getMatches.match_id,
      match: getMatches.match,
      year: getMatches.year,
    }
  }
  response.send(getMatches.map(each => result(each)))
})
//API6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayers = `
  SELECT *
  FROM player_match_score INNER JOIN player_details
  ON player_match_score.player_id = player_details.player_id
  WHERE player_match_score.match_id = ${matchId};
  `
  const getPlayers1 = await db.all(getPlayers)
  const result = getPlayers1 => {
    return {
      playerId: getPlayers1.player_id,
      playerName: getPlayers1.player_name,
    }
  }
  response.send(getPlayers1.map(each => result(each)))
})
//API7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getdetails = `
  SELECT player_details.player_id AS playerId, player_details.player_name AS playerName,SUM(player_match_score.score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
  FROM player_details INNER JOIN player_match_score
  ON player_details.player_id = player_match_score.player_id 
  WHERE player_details.player_id = ${playerId};
  `
  const statistics = await db.get(getdetails)
  response.send({
    playerId: statistics.playerId,
    playerName: statistics.playerName,
    totalScore: statistics.totalScore,
    totalFours: statistics.totalFours,
    totalSixes: statistics.totalSixes,
  })
})
module.exports = app
