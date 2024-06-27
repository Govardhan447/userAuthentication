const express = require('express')
const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const path = require('path')
const dbpath = path.join(__dirname, 'userData.db')

let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Runnning on http://localhost/3000/')
    })
  } catch (e) {
    console.log(`DB error:${e.meassage}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

//POST Create user Account API 1

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  let hashedPassword = await bcrypt.hash(password, 10)

  const searchUserName = `SELECT * FROM user WHERE username ='${username}';`
  const dbUser = await db.get(searchUserName)

  if (dbUser === undefined) {
    const creatUserQuery = `INSERT INTO
                user(username, name, password, gender,location)
              VALUES
                ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const dbResponse = await db.run(creatUserQuery)
      const newUserId = dbResponse.lastID
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
//POST login user Account API 2

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const searchUserName = `SELECT * FROM user WHERE username ='${username}';`
  const dbUser = await db.get(searchUserName)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compareUserPassword = await bcrypt.compare(password, dbUser.password)
    if (compareUserPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//Put change password API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const searchUserName = `SELECT * FROM user WHERE username ='${username}';`
  const dbUser = await db.get(searchUserName)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const compareUserPassword = await bcrypt.compare(
      oldPassword,
      dbUser.password,
    )
    if (compareUserPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const hashedPassword = await bcrypt.hash(request.body.newPassword, 10)
        const updatePasswordQuery = `UPDATE
              user
            SET
              password = '${hashedPassword}'
            WHERE
              username ='${username}';`
        const dbResponse = await db.run(updatePasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
