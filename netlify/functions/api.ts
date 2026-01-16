import serverless from "serverless-http";
import express from "express";
import { registerRoutes } from "../../server/routes";
import http from "http";

const app = express();
app.use(express.json());

// Mock httpServer for registerRoutes since Netlify uses serverless functions
const mockServer = {} as http.Server;

// We need to adapt registerRoutes or ensure it only adds routes to 'app'
// In our current template, registerRoutes(httpServer, app) adds routes to app
registerRoutes(mockServer, app).then(() => {
  console.log("Routes registered for Netlify Function");
});

export const handler = serverless(app);
