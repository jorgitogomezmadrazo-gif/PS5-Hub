FROM node:22-bookworm
WORKDIR /app
COPY . .
# every step below is allowed to fail without breaking the deploy: the hub itself always starts,
# only the Scramjet proxy part is skipped if a package can't be installed
RUN npm install --omit=dev --no-audit --no-fund || npm install --omit=dev --legacy-peer-deps --no-audit --no-fund || echo "WARNING: npm install failed - proxy disabled"
RUN node scripts/fetch-scramjet.mjs || echo "WARNING: scramjet files not found - proxy disabled"
RUN ls
ENV PORT=8080
EXPOSE 8080
CMD ["node","server.js"]
