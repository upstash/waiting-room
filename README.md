# Waiting Room with Cloudflare Workers and Upstash Redis
              
This project is an open source implementation of a waiting room for websites. You can set a maximum capacity for your web site and when the capacity is full, new users are forwarded to the waiting room page. When new spots are available, waiting users are allowed to the site. It is similar to [Cloudflare Waiting Room](https://www.cloudflare.com/waiting-room/) but free and open source.

## How to set up?
You need Cloudflare and Upstash account. We use Cloudflare Workers to intercept the web requests and Upstash Redis to keep session information.

We will use [wrangler](https://github.com/cloudflare/wrangler) to run and deploy the Workers function. 

### Clone and configure the project
```shell
git clone git@github.com:upstash/waiting-room.git
cd waiting-room
npm install
```
           
Create an [Upstash database](https://docs.upstash.com/). Select Global database to minimize the latency. Ensure the database is completely empty as the keyspace will be used for the active sessions. 

Update the below fields in `wrangler.toml`: 

**`account_id`** Check [this guide](https://developers.cloudflare.com/workers/get-started/guide#3-configure-the-workers-cli) how to find your account id.

**`UPSTASH_REDIS_REST_URL`** Copy this from [Upstash console](https://console.upstash.com).

**`UPSTASH_REDIS_REST_TOKEN`** Copy this from [Upstash console](https://console.upstash.com).
                                                                       
**`TOTAL_ACTIVE_USERS`** This denotes the maximum capacity of your website. When the number of active sessions exceeds this number, new users are forwarded to the waiting room page.

**`SESSION_DURATION_SECONDS`** This is the seconds how long a session can stay idle. 

### Test
```shell
wrangler dev
```
You can set `TOTAL_ACTIVE_USERS` to 1 for ease of testing. Browse the page from two different browsers, at the latest attempt, you should see the waiting room.

### Deploy
```shell
wrangler publish
```

## How to 
  
### Customize the Waiting Room HTML
Open index.js and edit the `waiting_room_html` variable at the bottom.

### Forward all visitors to the waiting room
Set `TOTAL_ACTIVE_USERS` to 0. So all users will be forwarded to waiting room. This might be useful when you are doing some temporary maintenance. 

