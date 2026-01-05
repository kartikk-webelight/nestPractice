require("dotenv").config();
const scanner = require("sonarqube-scanner").default;

scanner(
  {
    serverUrl: process.env.SONAR_SERVER_URL,
    token: process.env.SONAR_TOKEN,
    options: {
      "sonar.projectKey": "budget-control-api",
      "sonar.qualitygate.wait": "true",
      "sonar.token": process.env.SONAR_TOKEN,
      "sonar.exclusions": "node_modules/**, src/migrations/**", // exclude node_modules from analysis
      // "sonar.verbose": "true", // this for debug
    },
  },
  (error) => {
    if (error) {
      return process.exit(1);
    }
    return process.exit(0);
  },
);
