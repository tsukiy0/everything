FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-18-bullseye

# packages
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    vim \
    tmux

# terraform
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com bullseye main" | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform