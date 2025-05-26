// src/CdCli/sys/cd-comm/controllers/cd-logger.controller.ts

CdLog.aiInfo = (msg: string) => {
  const line = `[${new Date().toISOString()}] ℹ️ ${msg}`;
  CdAiLogRouter.push(line);
};

CdLog.aiDebug = (msg: string) => {
  const line = `[${new Date().toISOString()}] 🛠️ ${msg}`;
  CdAiLogRouter.push(line);
};
