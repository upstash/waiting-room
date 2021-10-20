import { parse } from 'cookie'

addEventListener('fetch', (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err.stack, { status: 500 }),
    ),
  )
})

const COOKIE_NAME = '__waiting_room_id'

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

    if (cookie[COOKIE_NAME] != null) {
      userId = cookie[COOKIE_NAME]
    } else {
      userId = makeid(8)
    }


    let res = await fetch(UPSTASH_REDIS_REST_URL + 'dbsize', init)
    let obj = await res.json()
    console.log('current capacity:' + obj.result)
    // there is enough capacity
    if (obj.result < TOTAL_ACTIVE_USERS) {
      await fetch(UPSTASH_REDIS_REST_URL + `set/${userId}/1/EX/${SESSION_DURATION_SECONDS}`, init)
      return getDefaultResponse(request, userId)
    } else {  // site capacity is full
      let res2 = await fetch(UPSTASH_REDIS_REST_URL + `get/${userId}`, init)
      let obj2 = await res2.json()
      if (obj2.result === '1') { // the user has already active session
        return getDefaultResponse(request, userId)
      } else { // capacity is full so the user is forwarded to waiting room
        return getWaitingRoomResponse(userId)
      }

    }
  } else {
    return fetch(request)
  }
}

async function getDefaultResponse(request, userId) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  // uncomment below to test in your local
  // const newResponse = new Response("Hello World!!", response)
  newResponse.headers.append('Set-Cookie', `${COOKIE_NAME}=${userId}; path=/`)
  return newResponse
}

async function getWaitingRoomResponse(userId) {
  const newResponse = new Response(waiting_room_html)
  newResponse.headers.append('Set-Cookie', `${COOKIE_NAME}=${userId}; path=/`)
  newResponse.headers.append('content-type', 'text/html;charset=UTF-8')
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

const waiting_room_html = `<!DOCTYPE html>
<head>
        <title>Waiting Room</title>
        <meta http-equiv='refresh' content='5' />
    </head>
<body>
  <h2>You are now in line.</h2>
  <h2>Thanks for your patience.</h2>
  <p>We are experiencing a high volume of traffic. Please sit tight and we will let you in soon. </p>
  
  <h4>This page will automatically refresh, please do not close your browser.</h4>
</body>`