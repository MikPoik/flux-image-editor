# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.19.3
FROM node:${NODE_VERSION}-slim AS base

ENV VITE_STRIPE_PRICE_1499=price_1S5WSwAjO3bJH7LMRfQMzyav
ENV VITE_STRIPE_PRICE_999=price_1S5WSFAjO3bJH7LMwjXX5k9l
ENV VITE_STRIPE_PRICE_499=price_1S5WRZAjO3bJH7LMvbJWNG9u
ENV VITE_STRIPE_PUBLIC_KEY=pk_live_51NgMvNAjO3bJH7LMibpwSbNuB7Yanzitp1rcJFtSF034dAds5X7JNVWuS6WYw5gmjQEGSwccUsqk7PbM96ivqQFg00W8EdsvLx
ENV VITE_STACK_PROJECT_ID=ae7323ce-ef12-4010-8508-62aa154841a8
ENV VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_p9ac714ehw0shwqa6snbkb7e2zv4s8kkpv9bpzvc06bh0
ENV VITE_GA_ID=G-HXPWK1TPPV

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 5000
CMD [ "npm", "run", "start" ]
