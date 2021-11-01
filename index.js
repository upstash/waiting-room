import { parse } from 'cookie'
import { auth, dbsize, get, setex } from '@upstash/redis'


auth(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)


addEventListener('fetch', (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 }),
    ),
  )
})

const COOKIE_NAME_ID = '__waiting_room_id'
const COOKIE_NAME_TIME = '__waiting_room_last_update_time'

const init = {
  headers: {
    'Authorization': 'Bearer ' + UPSTASH_REDIS_REST_TOKEN,
  },
}

async function handleRequest(request) {
  const { pathname } = new URL(request.url)
  if (!pathname.startsWith('/favicon')) {
    const cookie = parse(request.headers.get('Cookie') || '')
    let userId

    if (cookie[COOKIE_NAME_ID] != null) {
      userId = cookie[COOKIE_NAME_ID]
    } else {
      userId = makeid(8)
    }

    let res = await dbsize()
    console.log('current capacity:' + res.data)
    // there is enough capacity
    if (res.data < TOTAL_ACTIVE_USERS) {
      return getDefaultResponse(request, cookie, userId)
    } else {  // site capacity is full
      let obj2 = await get(userId)
      if (obj2.data === '1') { // the user has already active session
        return getDefaultResponse(request, cookie, userId)
      } else { // capacity is full so the user is forwarded to waiting room
        return getWaitingRoomResponse(userId)
      }
    }
  } else {
    return fetch(request)
  }
}

async function getDefaultResponse(request, cookie, userId) {
  // uncomment below to test the function with a static html content
  // const newResponse = new Response(default_html)
  // newResponse.headers.append('content-type', 'text/html;charset=UTF-8')

  const response = await fetch(request)
  const newResponse = new Response(response.body, response)

  const now = Date.now()
  let lastUpdate = cookie[COOKIE_NAME_TIME]
  if (!lastUpdate)
    lastUpdate = 0
  const diff = now - lastUpdate
  const updateInterval = SESSION_DURATION_SECONDS * 1000 / 2
  if (diff > updateInterval) {
    await setex(userId, SESSION_DURATION_SECONDS, 1)
    newResponse.headers.append('Set-Cookie', `${COOKIE_NAME_TIME}=${now}; path=/`)
  }

  newResponse.headers.append('Set-Cookie', `${COOKIE_NAME_ID}=${userId}; path=/`)
  return newResponse
}

async function getWaitingRoomResponse(userId) {
  const newResponse = new Response(waiting_room_html)
  newResponse.headers.set('content-type', 'text/html;charset=UTF-8')
  return newResponse
}


function makeid(length) {
  var result = ''
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength))
  }
  return result
}

const waiting_room_html = `
<title>Waiting Room</title>
<meta http-equiv='refresh' content='30' />

<style>*{box-sizing:border-box;margin:0;padding:0}body{line-height:1.4;font-size:1rem;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;padding:2rem;display:grid;place-items:center;min-height:100vh}.container{width:100%;max-width:800px}p{margin-top:.5rem}</style>

<div class='container'>
  <h1>
    <div>You are now in line.</div>
    <div>Thanks for your patience.</div>
  </h1>
  <p>We are experiencing a high volume of traffic. Please sit tight and we will let you in soon. </p>
  <p><b>This page will automatically refresh, please do not close your browser.</b></p>
</div>
`


const default_html = `
<title>Waiting Room Demo</title>

<style>*{box-sizing:border-box;margin:0;padding:0}body{line-height:1.4;font-size:1rem;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;padding:2rem;display:grid;place-items:center;min-height:100vh}.container{width:100%;max-width:800px}p{margin-top:.5rem}</style>

<div class="container">
  <h1>
    <div>Waiting Room Demo</div>
  </h1>
    <p>
              Visit this site from a different browser, you will be forwarded to the waiting room when the capacity is full.
    </p>
  <p>  Check <a href={"https://github.com/upstash/waiting-room"} style={{"color": "blue"}}>this project </a> to set up a waiting room for your website.</p>
</div>
`