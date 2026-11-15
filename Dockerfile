# Runs the development server in a container:
#   docker build -t portfolio .
#   docker run -p 5173:5173 portfolio

FROM node:22-alpine

WORKDIR /app

# Install dependencies first so this layer is reused until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host makes the server reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host"]
