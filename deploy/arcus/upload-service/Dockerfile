FROM node:20-bookworm-slim
WORKDIR /app
RUN npm init -y && npm install express@4 multer@2 --omit=dev
COPY server.js .
ENV PORT=3050
ENV UPLOAD_ROOT=/data/uploads
RUN mkdir -p /data/uploads
EXPOSE 3050
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3050/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "server.js"]
