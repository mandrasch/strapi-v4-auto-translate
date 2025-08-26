# https://docs-v4.strapi.io/dev-docs/installation/docker

FROM node:18-alpine

# Disabled for now, sharp for image resizing is optional (add later, install issues)
# Installing libvips-dev for sharp Compatibility
# RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

# Downgrade npm to v9, v10 had trouble with
# ERR_INVALID_ARG_TYPE with "path" being null locally
RUN npm install -g npm@9

WORKDIR /opt/
# Removed package-lock.json, we don't track it here
# COPY package.json package-lock.json ./
COPY package.json ./

# Disabled for now, sharp for image resizing is optional (add later, install issues)
# RUN npm install -g node-gyp

RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install
ENV PATH /opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
RUN chown -R node:node /opt/app
USER node
RUN ["npm", "run", "build"]
EXPOSE 1337
CMD ["npm", "run", "develop"]
