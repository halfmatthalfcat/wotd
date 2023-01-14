FROM        node:16
WORKDIR     /app
COPY        package.json    ./package.json
COPY        yarn.lock       ./yarn.lock
COPY        lerna.json      ./lerna.json
COPY        packages/prisma ./packages/prisma
COPY        packages/bot    ./packages/bot
RUN         yarn --frozen-lockfile --production
WORKDIR     ./packages/bot
ENTRYPOINT  yarn start