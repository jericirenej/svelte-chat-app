module.exports = {
  apps: Array.from(Array(8), (_, i) => {
    const count = i + 1;
    const port = 5173 + count;
    const storage = `chat_test_${count}`;
    return {
      name: `server-${count}`,
      script: `npx vite preview --port ${port}`,
      env: {
        POSTGRES_DB: storage,
        MINIO_BUCKET: storage
      }
    };
  })
};
