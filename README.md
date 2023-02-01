# Discord Word of the Day Bot

This project houses the server, db and frontend for hosting the Discord WotD bot.

## Overview
WotD bot serves Discord Guilds a word of the day from various sources of their choosing.
It runs a daily cron job that pulls new words and stores them in Postgres. Every minute it sends new
words out to Guilds based on their desired daily schedule via a different job.

## Stack

* Backend
  * Typescript/ts-node
  * node-cron to run some jobs
* Frontend
  * Typescript/Next/Vercel
  * Mantine for UI
* DB
  * Postgres
  * Prisma

## Deployment

### Database

I use a managed Postgres instance in DigitalOcean to store various things related to
serving the word of the day.

Any changes to the schema are handled by Prisma locally and pushed into production.

### Backend
During CI (GH Actions), a container is built for the `bot` lerna package which houses
all the bot related code. I leverage [`lerna-docker`](https://github.com/halfmatthalfcat/lerna-docker) (built by me)
to do the building and versioning of containers. The container is then pushed into DigitalOcean's
container registry.

The app is deployed via DigitalOcean's Apps platform.

### Frontend
The frontend code is deployed via Vercel on every push.

## Bugs, Features, etc

If you have any bugs or feature requests, submit one via the Github Issues tab.