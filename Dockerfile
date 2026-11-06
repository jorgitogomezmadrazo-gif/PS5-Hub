FROM node:22-bookworm
WORKDIR /app
COPY package.json ./
# every step below is allowed to fail without breaking the deploy: the hub itself always starts,
# only the Scramjet proxy part is skipped if a package can't be installed
RUN npm install --omit=dev --no-audit --no-fund || npm install --omit=dev --legacy-peer-deps --no-audit --no-fund || echo "WARNING: npm install failed - proxy disabled"
COPY scripts ./scripts
RUN node scripts/fetch-scramjet.mjs || echo "WARNING: scramjet files not found - proxy disabled"
COPY server.js ./
COPY public ./public
RUN for d in scramjet controller; do if [ -d "$d" ]; then cp -r "$d" public/; fi; done; ls public
ENV PORT=8080
EXPOSE 8080
CMD ["node","server.js"]
