FROM node:18-bullseye as dep_cache

WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile

FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    curl

# terraform
RUN apt-get update && apt-get install -y wget
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bullseye main" | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform

WORKDIR /app
COPY --from=dep_cache /app/node_modules ./node_modules