const { fail } = require("danger");
  const { getFileIssues } = require("cspell");
  
  async function gitSpellcheck() {
    const filesToCheck = danger.git.created_files.concat(danger.git.modified_files).filter(
      (file) => !file.includes("node_modules") && file.endsWith(".ts")
    );
  
    const results = await getFileIssues(filesToCheck, { config: "cspell.js" });
  
    results.forEach((issue) => {
      fail(`Potential typo in ${issue.uri} at line ${issue.row + 1}: "${issue.text}"`);
    });
  }
  
  module.exports = { gitSpellcheck };
  